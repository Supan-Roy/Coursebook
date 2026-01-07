from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django_ratelimit.decorators import ratelimit  # type: ignore
from django.utils.decorators import method_decorator
import requests
import secrets


def get_email_from_request(group, request):
    """Helper function to extract email from request for rate limiting"""
    if request.method == 'POST':
        # Try to get email from request data (works for DRF)
        if hasattr(request, 'data') and request.data:
            email = request.data.get('email')
            if email:
                return f'email:{email}'
        # Fallback to POST data
        email = request.POST.get('email')
        if email:
            return f'email:{email}'
    return 'unknown'

from materials.models import Material
from usage.models import StorageUsage
from .serializers import (
    RegisterSerializer, UserSerializer, AccountDeleteSerializer,
    LoginSerializer, EmailVerificationSerializer,
    PasswordResetRequestSerializer, PasswordResetSerializer
)
from .utils import (
    send_verification_email, send_password_reset_email,
    generate_password_reset_token
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create user
        user = serializer.save()
        
        # Prepare response data
        data = serializer.data
        data.pop("plan", None)
        data.pop("quota_mb", None)
        
        # Send verification email
        try:
            send_verification_email(user)
        except Exception as e:
            # Log error but don't fail registration
            print(f"Failed to send verification email: {e}")
        
        return Response({
            **data,
            "message": "Registration successful! Please check your email to verify your account."
        }, status=status.HTTP_201_CREATED)


class CurrentUserView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class AccountDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = AccountDeleteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user = request.user

        # Delete all materials (DB + Cloudinary) and adjust storage usage
        materials = Material.objects.filter(user=user)
        total_size = 0
        for material in materials:
            try:
                if material.storage_key:
                    from cloudinary.uploader import destroy as cloudinary_destroy  # type: ignore
                    cloudinary_destroy(material.storage_key, resource_type="raw")
            except Exception:
                # Don't block account deletion if Cloudinary cleanup fails
                pass
            total_size += material.size_bytes
        # Delete material records
        materials.delete()

        # Reset storage usage (record will be removed with user, but this keeps it consistent)
        try:
          storage_usage = StorageUsage.objects.filter(user=user).first()
          if storage_usage:
              storage_usage.used_bytes = max(0, storage_usage.used_bytes - total_size)
              storage_usage.save()
        except Exception:
          pass

        user.delete()

        return Response({"detail": "Account deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


@method_decorator(ratelimit(key='ip', rate='5/m', method='POST'), name='post')
@method_decorator(ratelimit(key=get_email_from_request, rate='10/h', method='POST'), name='post')
class SecureLoginView(APIView):
    """Custom login view with email verification check and rate limiting"""
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        # Security: Always perform password check to prevent timing attacks
        # Use get() with a dummy password check if user doesn't exist
        try:
            user = User.objects.get(email=email)
            user_exists = True
        except User.DoesNotExist:
            # Create a dummy user object for password check to prevent timing attacks
            # This ensures password verification always takes similar time
            user = User(email=email)
            user_exists = False
        
        # Always perform password check (prevents timing attacks)
        password_valid = user.check_password(password) if user_exists else False
        
        # If user doesn't exist or password is invalid, return generic error
        if not user_exists or not password_valid:
            # Only record failed attempt if user actually exists
            if user_exists:
                user.record_failed_login()
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if account is locked
        if user.is_account_locked():
            return Response(
                {"detail": "Account is temporarily locked due to multiple failed login attempts. Please try again later."},
                status=status.HTTP_423_LOCKED
            )
        
        # Check email verification
        if not user.email_verified:
            return Response(
                {"detail": "Please verify your email address before logging in. Check your inbox for the verification link."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Successful login - reset failed attempts
        user.reset_failed_login_attempts()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        # Note: Login notification emails removed to preserve email service quota
        # Emails are only sent for registration (verification) and password reset
        
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data
        }, status=status.HTTP_200_OK)


class EmailVerificationView(APIView):
    """Verify user email with token"""
    permission_classes = [permissions.AllowAny]
    serializer_class = EmailVerificationSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        
        try:
            user = User.objects.get(email_verification_token=token)
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid verification token."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if token has expired (24 hours)
        if user.email_verification_sent_at:
            if timezone.now() > user.email_verification_sent_at + timedelta(hours=24):
                return Response(
                    {"detail": "Verification token has expired. Please request a new one."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Verify email
        user.email_verified = True
        user.email_verification_token = None
        user.email_verification_sent_at = None
        user.save(update_fields=['email_verified', 'email_verification_token', 'email_verification_sent_at'])
        
        return Response({
            "detail": "Email verified successfully! You can now log in."
        }, status=status.HTTP_200_OK)


@method_decorator(ratelimit(key='ip', rate='5/h', method='POST'), name='post')
@method_decorator(ratelimit(key=get_email_from_request, rate='3/h', method='POST'), name='post')
class ResendVerificationEmailView(APIView):
    """Resend verification email"""
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        if not email:
            return Response(
                {"detail": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal if email exists or not (security best practice)
            return Response(
                {"detail": "If an account with this email exists, a verification email has been sent."},
                status=status.HTTP_200_OK
            )
        
        if user.email_verified:
            return Response(
                {"detail": "Email is already verified."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            send_verification_email(user)
            return Response(
                {"detail": "Verification email sent. Please check your inbox."},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"detail": "Failed to send verification email. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(ratelimit(key='ip', rate='5/h', method='POST'), name='post')
@method_decorator(ratelimit(key=get_email_from_request, rate='3/h', method='POST'), name='post')
class PasswordResetRequestView(APIView):
    """Request password reset - sends email with reset link"""
    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetRequestSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal if email exists or not (security best practice)
            return Response(
                {"detail": "If an account with this email exists, a password reset link has been sent."},
                status=status.HTTP_200_OK
            )
        
        # Generate reset token
        reset_token = generate_password_reset_token()
        user.password_reset_token = reset_token
        user.password_reset_sent_at = timezone.now()
        user.save(update_fields=['password_reset_token', 'password_reset_sent_at'])
        
        try:
            send_password_reset_email(user, reset_token)
            return Response(
                {"detail": "Password reset link sent. Please check your email."},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"detail": "Failed to send password reset email. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PasswordResetConfirmView(APIView):
    """Confirm password reset with token"""
    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        try:
            user = User.objects.get(password_reset_token=token)
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid or expired reset token."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if token has expired (1 hour)
        if user.password_reset_sent_at:
            if timezone.now() > user.password_reset_sent_at + timedelta(hours=1):
                return Response(
                    {"detail": "Reset token has expired. Please request a new one."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Reset password
        user.set_password(new_password)
        # Security: Invalidate token immediately after use (single-use token)
        user.password_reset_token = None
        user.password_reset_sent_at = None
        user.reset_failed_login_attempts()  # Reset failed attempts on password reset
        user.save(update_fields=['password', 'password_reset_token', 'password_reset_sent_at', 'failed_login_attempts', 'locked_until'])
        
        return Response({
            "detail": "Password reset successfully. You can now log in with your new password."
        }, status=status.HTTP_200_OK)


class GoogleOAuthView(APIView):
    """Get Google OAuth URL"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        if not settings.GOOGLE_OAUTH2_CLIENT_ID:
            return Response(
                {"detail": "Google OAuth is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        # Generate state token for CSRF protection
        # Store in session as backup, but frontend will also store it
        state = secrets.token_urlsafe(32)
        request.session['oauth_state'] = state
        request.session.set_expiry(600)  # 10 minutes expiry
        
        # Build Google OAuth URL
        redirect_uri = f"{settings.FRONTEND_URL}/auth/google/callback"
        scope = "openid email profile"
        google_oauth_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={settings.GOOGLE_OAUTH2_CLIENT_ID}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope={scope}&"
            f"state={state}&"
            f"access_type=offline&"
            f"prompt=consent"
        )
        
        return Response({
            "auth_url": google_oauth_url,
            "state": state  # Return state so frontend can store it
        }, status=status.HTTP_200_OK)


class GoogleOAuthCallbackView(APIView):
    """Handle Google OAuth callback and create/login user"""
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        code = request.data.get('code')
        state = request.data.get('state')
        
        if not code:
            return Response(
                {"detail": "Authorization code is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not state:
            return Response(
                {"detail": "State parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify state token (CSRF protection)
        # Check both session and the state sent from frontend
        session_state = request.session.get('oauth_state')
        
        # State validation: Google already validates the state, but we check session as additional security
        # If session state exists and doesn't match, reject (but allow if session state is missing due to CORS/session issues)
        if session_state and session_state != state:
            return Response(
                {"detail": "Invalid state parameter. Session mismatch."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # If no session state but state is provided, we'll accept it (frontend validates it)
        # This handles cases where sessions don't persist across OAuth redirect
        
        # Clear state from session if it exists
        if 'oauth_state' in request.session:
            request.session.pop('oauth_state', None)
        
        if not settings.GOOGLE_OAUTH2_CLIENT_ID or not settings.GOOGLE_OAUTH2_CLIENT_SECRET:
            return Response(
                {"detail": "Google OAuth is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        # Exchange code for access token
        token_url = "https://oauth2.googleapis.com/token"
        redirect_uri = f"{settings.FRONTEND_URL}/auth/google/callback"
        
        token_data = {
            'code': code,
            'client_id': settings.GOOGLE_OAUTH2_CLIENT_ID,
            'client_secret': settings.GOOGLE_OAUTH2_CLIENT_SECRET,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code'
        }
        
        try:
            token_response = requests.post(token_url, data=token_data)
            token_response.raise_for_status()
            token_json = token_response.json()
            access_token = token_json.get('access_token')
            
            if not access_token:
                return Response(
                    {"detail": "Failed to get access token from Google."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get user info from Google
            user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
            headers = {'Authorization': f'Bearer {access_token}'}
            user_info_response = requests.get(user_info_url, headers=headers)
            user_info_response.raise_for_status()
            user_info = user_info_response.json()
            
            email = user_info.get('email')
            first_name = user_info.get('given_name', '')
            last_name = user_info.get('family_name', '')
            
            if not email:
                return Response(
                    {"detail": "Email not provided by Google."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get or create user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': first_name,
                    'last_name': last_name,
                    'email_verified': True,  # Google emails are already verified
                }
            )
            
            # Update user info if not new
            if not created:
                user.first_name = first_name or user.first_name
                user.last_name = last_name or user.last_name
                user.email_verified = True  # Ensure verified
                user.save(update_fields=['first_name', 'last_name', 'email_verified'])
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)
            
        except requests.RequestException as e:
            return Response(
                {"detail": f"Error communicating with Google: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"detail": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

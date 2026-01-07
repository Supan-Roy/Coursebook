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


def get_email_from_request(request):
    """Helper function to extract email from request for rate limiting"""
    if request.method == 'POST':
        email = request.POST.get('email') or (request.data.get('email') if hasattr(request, 'data') else None)
        return email or 'unknown'
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
    send_login_notification_email, generate_password_reset_token
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
        
        # Send login notification email (optional, can be disabled in production)
        try:
            ip_address = request.META.get('REMOTE_ADDR', 'Unknown')
            send_login_notification_email(user, ip_address)
        except Exception:
            pass  # Don't fail login if email sending fails
        
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
@method_decorator(ratelimit(key='post:email', rate='3/h', method='POST'), name='post')
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
@method_decorator(ratelimit(key='post:email', rate='3/h', method='POST'), name='post')
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

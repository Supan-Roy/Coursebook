from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView, CurrentUserView, AccountDeleteView,
    SecureLoginView, EmailVerificationView, ResendVerificationEmailView,
    PasswordResetRequestView, PasswordResetConfirmView,
    GoogleOAuthView, GoogleOAuthCallbackView
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", SecureLoginView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", CurrentUserView.as_view(), name="current_user"),
    path("delete-account/", AccountDeleteView.as_view(), name="account_delete"),
    path("verify-email/", EmailVerificationView.as_view(), name="verify_email"),
    path("resend-verification/", ResendVerificationEmailView.as_view(), name="resend_verification"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password_reset_request"),
    path("password-reset-confirm/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("google/", GoogleOAuthView.as_view(), name="google_oauth"),
    path("google/callback/", GoogleOAuthCallbackView.as_view(), name="google_oauth_callback"),
]

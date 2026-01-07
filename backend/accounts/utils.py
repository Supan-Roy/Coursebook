import secrets
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


def generate_verification_token():
    """Generate a secure random token for email verification"""
    return secrets.token_urlsafe(32)


def generate_password_reset_token():
    """Generate a secure random token for password reset"""
    return secrets.token_urlsafe(32)


def send_verification_email(user):
    """Send email verification link to user"""
    token = generate_verification_token()
    user.email_verification_token = token
    user.email_verification_sent_at = timezone.now()
    user.save(update_fields=['email_verification_token', 'email_verification_sent_at'])
    
    verification_url = f"{settings.FRONTEND_URL}/verify-email/{token}/"
    
    subject = "Verify your Coursebook account"
    message = f"""
Hello {user.first_name or 'there'},

Thank you for registering with Coursebook! Please verify your email address by clicking the link below:

{verification_url}

This link will expire in 24 hours.

If you didn't create an account with Coursebook, please ignore this email.

Best regards,
The Coursebook Team
"""
    
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )
    
    return token


def send_password_reset_email(user, reset_token):
    """Send password reset link to user"""
    reset_url = f"{settings.FRONTEND_URL}/reset-password/{reset_token}/"
    
    subject = "Reset your Coursebook password"
    message = f"""
Hello {user.first_name or 'there'},

You requested to reset your password for your Coursebook account. Click the link below to reset it:

{reset_url}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email and your password will remain unchanged.

Best regards,
The Coursebook Team
"""
    
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )


def send_login_notification_email(user, ip_address=None):
    """Send email notification when user logs in"""
    subject = "New login to your Coursebook account"
    message = f"""
Hello {user.first_name or 'there'},

There was a new login to your Coursebook account.

If this was you, you can safely ignore this email.

If you don't recognize this login, please change your password immediately and contact support.

IP Address: {ip_address or 'Unknown'}

Best regards,
The Coursebook Team
"""
    
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )


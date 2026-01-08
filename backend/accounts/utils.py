import secrets
import random
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


def generate_verification_token():
    """Generate a secure random token for email verification (legacy, kept for compatibility)"""
    return secrets.token_urlsafe(32)


def generate_otp():
    """Generate a 6-digit OTP for email verification"""
    return str(random.randint(100000, 999999))


def generate_password_reset_token():
    """Generate a secure random token for password reset"""
    return secrets.token_urlsafe(32)


def send_verification_email(user):
    """Send email verification OTP to user"""
    otp = generate_otp()
    user.email_verification_token = otp
    user.email_verification_sent_at = timezone.now()
    user.save(update_fields=['email_verification_token', 'email_verification_sent_at'])
    
    subject = "Verify your Coursebook account"
    message = f"""
Hello {user.first_name or 'there'},

Thank you for registering with Coursebook! Please verify your email address using the OTP code below:

Your verification code: {otp}

This code will expire in 10 minutes.

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
    
    return otp


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


def generate_account_deletion_token():
    """Generate a secure random token for account deletion"""
    return secrets.token_urlsafe(32)


def send_account_deletion_email(user, deletion_reasons=None):
    """Send account deletion confirmation link to user"""
    token = generate_account_deletion_token()
    user.account_deletion_token = token
    user.account_deletion_sent_at = timezone.now()
    
    # Store deletion reasons as JSON string if provided
    if deletion_reasons:
        import json
        user.account_deletion_reasons = json.dumps(deletion_reasons)
    
    user.save(update_fields=['account_deletion_token', 'account_deletion_sent_at', 'account_deletion_reasons'])
    
    deletion_url = f"{settings.FRONTEND_URL}/delete-account-confirm/{token}/"
    
    reasons_text = ""
    if deletion_reasons:
        reasons_list = [reason for reason, checked in deletion_reasons.items() if checked]
        if reasons_list:
            reasons_text = "\n\nYou selected the following reasons:\n" + "\n".join(f"- {reason}" for reason in reasons_list)
    
    subject = "Confirm Account Deletion - Coursebook"
    message = f"""
Hello {user.first_name or 'there'},

You requested to delete your Coursebook account. To confirm this action, please click the link below:

{deletion_url}

This link will expire in 24 hours.{reasons_text}

⚠️ WARNING: This action is permanent and cannot be undone. All your data, including courses, materials, and todos, will be permanently deleted.

If you didn't request to delete your account, please ignore this email and your account will remain active.

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


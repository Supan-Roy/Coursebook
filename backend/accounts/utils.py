import random
import secrets
import threading
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .email_service import send_email_via_resend


def generate_verification_token():
    """Generate a secure random token for email verification (legacy, kept for compatibility)"""
    return secrets.token_urlsafe(32)


def generate_otp():
    """Generate a 6-digit OTP for email verification"""
    return str(random.randint(100000, 999999))


def generate_password_reset_token():
    """Generate a secure random token for password reset"""
    return secrets.token_urlsafe(32)


def _send_verification_email_sync(user, otp):
    """Internal function to send verification email synchronously"""
    subject = "Verify your Coursebook account"
    
    # Plain text version
    message = f"""
Hello {user.first_name or 'there'},

Thank you for registering with Coursebook! Please verify your email address using the OTP code below:

Your verification code: {otp}

This code will expire in 10 minutes.

If you didn't create an account with Coursebook, please ignore this email.

Best regards,
The Coursebook Team
"""
    
    # HTML version with bold and larger OTP
    html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .otp-code {{
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            letter-spacing: 4px;
            text-align: center;
            padding: 20px;
            background-color: #f3f4f6;
            border-radius: 8px;
            margin: 20px 0;
            display: inline-block;
            width: 100%;
            box-sizing: border-box;
        }}
        .footer {{
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <p>Hello {user.first_name or 'there'},</p>
    
    <p>Thank you for registering with Coursebook! Please verify your email address using the OTP code below:</p>
    
    <div class="otp-code">{otp}</div>
    
    <p>This code will expire in 10 minutes.</p>
    
    <p>If you didn't create an account with Coursebook, please ignore this email.</p>
    
    <div class="footer">
        <p>Best regards,<br>The Coursebook Team</p>
    </div>
</body>
</html>
"""
    
    try:
        if getattr(settings, "USE_RESEND_API", False):
            send_email_via_resend(subject, message, [user.email], html_message=html_message)
        else:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                html_message=html_message,
                fail_silently=False,
            )
    except Exception as e:
        # Log error but don't raise - email sending failure shouldn't break registration
        print(f"Failed to send verification email to {user.email}: {e}")


def send_verification_email(user, async_send=True):
    """Send email verification OTP to user
    
    Args:
        user: User instance
        async_send: If True, send email in background thread (default: True)
    """
    otp = generate_otp()
    user.email_verification_token = otp
    user.email_verification_sent_at = timezone.now()
    user.save(update_fields=['email_verification_token', 'email_verification_sent_at'])
    
    if async_send:
        # Send email in background thread to avoid blocking
        thread = threading.Thread(target=_send_verification_email_sync, args=(user, otp))
        thread.daemon = True  # Thread will terminate when main process exits
        thread.start()
    else:
        # Send synchronously (for testing or when needed)
        _send_verification_email_sync(user, otp)
    
    return otp


def _send_password_reset_email_sync(user, reset_token):
    """Internal function to send password reset email synchronously"""
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
    
    try:
        if getattr(settings, "USE_RESEND_API", False):
            send_email_via_resend(subject, message, [user.email])
        else:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
    except Exception as e:
        print(f"Failed to send password reset email to {user.email}: {e}")


def send_password_reset_email(user, reset_token, async_send=True):
    """Send password reset link to user
    
    Args:
        user: User instance
        reset_token: Password reset token
        async_send: If True, send email in background thread (default: True)
    """
    if async_send:
        # Send email in background thread to avoid blocking
        thread = threading.Thread(target=_send_password_reset_email_sync, args=(user, reset_token))
        thread.daemon = True
        thread.start()
    else:
        # Send synchronously (for testing or when needed)
        _send_password_reset_email_sync(user, reset_token)


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
    
    if getattr(settings, "USE_RESEND_API", False):
        send_email_via_resend(subject, message, [user.email])
    else:
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


def _send_account_deletion_email_sync(user, token, deletion_reasons=None):
    """Internal function to send account deletion email synchronously"""
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
    
    try:
        if getattr(settings, "USE_RESEND_API", False):
            send_email_via_resend(subject, message, [user.email])
        else:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
    except Exception as e:
        print(f"Failed to send account deletion email to {user.email}: {e}")


def send_account_deletion_email(user, deletion_reasons=None, async_send=True):
    """Send account deletion confirmation link to user
    
    Args:
        user: User instance
        deletion_reasons: Optional dict of deletion reasons
        async_send: If True, send email in background thread (default: True)
    """
    token = generate_account_deletion_token()
    user.account_deletion_token = token
    user.account_deletion_sent_at = timezone.now()
    
    # Store deletion reasons as JSON string if provided
    if deletion_reasons:
        import json
        user.account_deletion_reasons = json.dumps(deletion_reasons)
    
    user.save(update_fields=['account_deletion_token', 'account_deletion_sent_at', 'account_deletion_reasons'])
    
    if async_send:
        # Send email in background thread to avoid blocking
        thread = threading.Thread(target=_send_account_deletion_email_sync, args=(user, token, deletion_reasons))
        thread.daemon = True
        thread.start()
    else:
        # Send synchronously (for testing or when needed)
        _send_account_deletion_email_sync(user, token, deletion_reasons)
    
    return token


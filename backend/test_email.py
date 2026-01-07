"""
Test script to verify email configuration is working.
Run this after setting up your email credentials in .env file.

Usage:
    python manage.py shell < test_email.py
    OR
    python test_email.py
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def test_email():
    """Test email sending functionality"""
    
    print("=" * 60)
    print("Email Configuration Test")
    print("=" * 60)
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
    print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    print(f"FRONTEND_URL: {settings.FRONTEND_URL}")
    print("=" * 60)
    
    # Get test email from user
    test_email = input("\nEnter your email address to send test email: ").strip()
    
    if not test_email:
        print("No email provided. Exiting.")
        return
    
    try:
        print(f"\nSending test email to {test_email}...")
        send_mail(
            subject='Coursebook Email Test',
            message='''
Hello!

This is a test email from Coursebook. If you received this, your email configuration is working correctly!

You can now:
- Register new accounts and receive verification emails
- Request password resets
- Receive login notifications

Best regards,
Coursebook Team
            ''',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[test_email],
            fail_silently=False,
        )
        print("✅ Email sent successfully!")
        print(f"Please check {test_email} (including spam folder)")
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        print("\nTroubleshooting:")
        print("1. Check your .env file in backend/ directory")
        print("2. Verify EMAIL_HOST_USER and EMAIL_HOST_PASSWORD are correct")
        print("3. For Gmail: Make sure you're using an App Password, not your regular password")
        print("4. Check that 2-Step Verification is enabled for Gmail")

if __name__ == '__main__':
    test_email()


import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings
import traceback

print("Testing Resend email configuration...")
print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
print(f"EMAIL_HOST_PASSWORD: {'*' * 20 if settings.EMAIL_HOST_PASSWORD else 'NOT SET'}")
print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
print()

try:
    send_mail(
        'Test from Coursebook',
        'This is a test email from Coursebook using Resend.',
        settings.DEFAULT_FROM_EMAIL,
        ['supanroy2021@gmail.com'],
        fail_silently=False,
    )
    print("[SUCCESS] Email sent successfully!")
    print("Please check your inbox (and spam folder)")
except Exception as e:
    print(f"[ERROR] Error sending email: {e}")
    print("\nFull error:")
    traceback.print_exc()


import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings
import smtplib
from email.mime.text import MIMEText

print("=" * 60)
print("Resend Configuration Check")
print("=" * 60)
print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
print(f"EMAIL_HOST_PASSWORD: {'*' * 20 if settings.EMAIL_HOST_PASSWORD else 'NOT SET'}")
print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
print()

# Test SMTP connection
print("Testing SMTP connection...")
try:
    server = smtplib.SMTP('smtp.resend.com', 587)
    server.starttls()
    server.login('resend', settings.EMAIL_HOST_PASSWORD)
    print("[OK] SMTP connection successful")
    server.quit()
except Exception as e:
    print(f"[ERROR] SMTP connection failed: {e}")
    exit(1)

print()
print("Sending test email...")
try:
    result = send_mail(
        'Resend Test - Check Status',
        'This is a test email to check Resend delivery status.',
        settings.DEFAULT_FROM_EMAIL,
        ['supanroy2021@gmail.com'],
        fail_silently=False,
    )
    print(f"[OK] Django send_mail returned: {result}")
    print()
    print("Next steps:")
    print("1. Check Resend dashboard -> Logs")
    print("2. Click on the email to see detailed status")
    print("3. Check for any error messages or warnings")
    print("4. Verify your Resend account is not in sandbox/test mode")
    print("5. Check if there are any account restrictions")
except Exception as e:
    print(f"[ERROR] Failed to send email: {e}")
    import traceback
    traceback.print_exc()


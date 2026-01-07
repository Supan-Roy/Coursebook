# Email Setup Guide - Real Email Verification

This guide will help you set up real email sending for email verification, password reset, and login notifications.

## Quick Setup (Gmail - Recommended for Testing)

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account](https://myaccount.google.com/)
2. Click **Security** in the left sidebar
3. Under "Signing in to Google", enable **2-Step Verification** if not already enabled

### Step 2: Generate App Password
1. Still in Security settings, click **2-Step Verification**
2. Scroll down and click **App passwords**
3. Select **Mail** as the app
4. Select **Other (Custom name)** as the device
5. Enter "Coursebook" as the name
6. Click **Generate**
7. **Copy the 16-character password** (you'll need this)

### Step 3: Create/Update .env File
Create a file named `.env` in the `backend` directory with:

```env
# Email Configuration for Gmail
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-character-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
FRONTEND_URL=http://localhost:3001
```

**Replace:**
- `your-email@gmail.com` with your Gmail address
- `your-16-character-app-password` with the app password you generated

### Step 4: Test Email Sending
Run this command to test if email is working:

```bash
cd backend
python manage.py shell
```

Then in the shell:
```python
from django.core.mail import send_mail
from django.conf import settings

send_mail(
    'Test Email',
    'This is a test email from Coursebook.',
    settings.DEFAULT_FROM_EMAIL,
    ['your-test-email@gmail.com'],
    fail_silently=False,
)
```

If you receive the email, you're all set! 🎉

---

## Alternative: SendGrid (Recommended for Production)

SendGrid offers a free tier (100 emails/day) and is more reliable for production.

### Step 1: Create SendGrid Account
1. Go to [SendGrid](https://sendgrid.com/)
2. Sign up for a free account
3. Verify your email address

### Step 2: Create API Key
1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name it "Coursebook"
4. Select **Full Access** or **Restricted Access** (Mail Send)
5. Click **Create & View**
6. **Copy the API key** (you can only see it once!)

### Step 3: Update .env File
```env
# Email Configuration for SendGrid
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key-here
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
FRONTEND_URL=http://localhost:3001
```

**Note:** Replace `your-sendgrid-api-key-here` with your actual API key.

### Step 4: Verify Sender (Required)
1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in your details
4. Verify the email address SendGrid sends you

---

## Alternative: Mailgun (Good for Production)

### Step 1: Create Mailgun Account
1. Go to [Mailgun](https://www.mailgun.com/)
2. Sign up for a free account (5,000 emails/month free)

### Step 2: Get SMTP Credentials
1. Go to **Sending** → **Domain Settings**
2. Find your domain's SMTP credentials
3. Copy the **SMTP hostname**, **port**, **username**, and **password**

### Step 3: Update .env File
```env
# Email Configuration for Mailgun
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-mailgun-username
EMAIL_HOST_PASSWORD=your-mailgun-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
FRONTEND_URL=http://localhost:3001
```

---

## Testing Email Verification

After setting up email:

1. **Register a new account** - You should receive a verification email
2. **Check your inbox** (and spam folder)
3. **Click the verification link** - Should verify your email
4. **Try logging in** - Should work after verification

## Troubleshooting

### Emails not sending?
1. Check your `.env` file exists in `backend/` directory
2. Verify all email settings are correct
3. Check spam folder
4. For Gmail: Make sure 2FA is enabled and app password is correct
5. Check backend console for error messages

### Gmail "Less secure app" error?
- Use App Passwords (not your regular password)
- Make sure 2-Step Verification is enabled

### SendGrid emails going to spam?
- Verify your sender domain
- Set up SPF and DKIM records
- Use a verified sender email

### Testing in development?
- Emails will print to console if credentials are missing
- Check your backend terminal for email output

## Production Checklist

Before deploying:
- [ ] Use a production email service (SendGrid/Mailgun)
- [ ] Update `FRONTEND_URL` to your production domain
- [ ] Verify sender domain/email
- [ ] Set up SPF/DKIM records (for better deliverability)
- [ ] Test email sending in production environment
- [ ] Monitor email delivery rates

## Security Notes

- **Never commit `.env` file to git** (it's already in .gitignore)
- **Use environment variables** in production (not .env file)
- **Rotate API keys/passwords** regularly
- **Use different credentials** for development and production


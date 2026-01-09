# Email Setup Guide - Real Email Verification

This guide will help you set up real email sending for email verification, password reset, and login notifications.

## 🏆 Recommended: Mailgun (Best for Production)

**Free tier: 100 emails/day = ~3,000 emails/month**

Mailgun is reliable, production-ready, and has excellent deliverability. Perfect for your Coursebook project!

### Step 1: Create Mailgun Account
1. Go to [Mailgun](https://www.mailgun.com/)
2. Sign up for a free account
3. Verify your email address
4. Complete the account setup

### Step 2: Add and Verify Domain (Recommended)
**Option A: Use Sandbox Domain (Quick Start - Testing Only)**
- Mailgun provides a sandbox domain like `sandbox12345.mailgun.org`
- You can use this for testing, but emails may go to spam
- Good for development/testing

**Option B: Verify Your Own Domain (Production - Recommended)**
1. Go to **Sending** → **Domains** → **Add New Domain**
2. Enter your domain (e.g., `yourdomain.com`)
3. Mailgun will show DNS records to add:
   - **TXT record** for domain verification
   - **TXT record** for SPF
   - **CNAME record** for DKIM
   - **MX record** (optional, for receiving)
4. Add these records to your domain's DNS settings
5. Wait for verification (usually 5-60 minutes)
6. Once verified, you can use `noreply@yourdomain.com` as sender

### Step 3: Get SMTP Credentials
1. Go to **Sending** → **Domain Settings**
2. Select your domain (or sandbox domain)
3. Click on **SMTP credentials** tab
4. You'll see:
   - **SMTP hostname:** `smtp.mailgun.org`
   - **Port:** `587` (TLS) or `465` (SSL)
   - **Username:** Your SMTP username (e.g., `postmaster@your-domain.mailgun.org`)
   - **Password:** Your SMTP password (click "Reset password" if needed)

### Step 4: Create/Update .env File
```env
# Email Configuration for Mailgun
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=postmaster@your-domain.mailgun.org
EMAIL_HOST_PASSWORD=your-mailgun-smtp-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
FRONTEND_URL=http://localhost:3001
```

**Replace:**
- `postmaster@your-domain.mailgun.org` with your Mailgun SMTP username
- `your-mailgun-smtp-password` with your Mailgun SMTP password
- `noreply@yourdomain.com` with your verified sender email

**For Sandbox Domain (Quick Testing):**
```env
EMAIL_HOST_USER=postmaster@sandbox12345.mailgun.org
EMAIL_HOST_PASSWORD=your-sandbox-password
DEFAULT_FROM_EMAIL=postmaster@sandbox12345.mailgun.org
```

### Step 5: Test Email Sending
Run the test script:
```bash
cd backend
python test_email.py
```

If you receive the email, you're all set! 🎉

**Note:** If using sandbox domain, check spam folder. Verified domains have much better deliverability.

---

## Quick Setup (Gmail - Recommended for Testing Only)

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

## Alternative: SendGrid

SendGrid offers a free tier (100 emails/day = ~3,000/month).

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


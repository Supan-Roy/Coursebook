# Email Security Setup Guide

This document explains the email-based security features implemented for user login.

## Features Implemented

### 1. Email Verification
- Users must verify their email address before they can log in
- Verification tokens expire after 24 hours
- Users can resend verification emails if needed

### 2. Rate Limiting
- Login attempts are rate-limited to 5 attempts per minute per IP address
- Prevents brute force attacks

### 3. Account Lockout
- Accounts are locked after 5 failed login attempts
- Lock duration: 30 minutes
- Failed attempts are reset after successful login

### 4. Password Reset
- Users can request password reset via email
- Reset tokens expire after 1 hour
- Secure token-based password reset flow

### 5. Login Notifications
- Users receive email notifications when they log in
- Includes IP address information for security awareness

## Configuration

### Environment Variables

Add these to your `.env` file in the `backend` directory:

```env
# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
FRONTEND_URL=http://localhost:3001
```

### Gmail Setup (Example)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Use the generated password as `EMAIL_HOST_PASSWORD`

### Other Email Providers

#### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

#### Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_HOST_USER=your-mailgun-username
EMAIL_HOST_PASSWORD=your-mailgun-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

#### AWS SES
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-aws-access-key
EMAIL_HOST_PASSWORD=your-aws-secret-key
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

### Development Mode

In development, if email credentials are not configured, emails will be printed to the console instead of being sent. This is handled automatically.

## Database Migration

After implementing these changes, you need to create and run migrations:

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

## API Endpoints

### Authentication Endpoints

- `POST /api/auth/register/` - Register new user (sends verification email)
- `POST /api/auth/login/` - Login (requires verified email)
- `POST /api/auth/verify-email/` - Verify email with token
- `POST /api/auth/resend-verification/` - Resend verification email
- `POST /api/auth/password-reset/` - Request password reset
- `POST /api/auth/password-reset-confirm/` - Confirm password reset with token

### Frontend Routes

- `/verify-email/:token` - Email verification page
- `/forgot-password` - Password reset request page
- `/reset-password/:token` - Password reset confirmation page

## Security Features

1. **Email Verification**: Prevents unauthorized account creation
2. **Rate Limiting**: Protects against brute force attacks
3. **Account Lockout**: Temporarily locks accounts after multiple failed attempts
4. **Secure Tokens**: Uses cryptographically secure random tokens
5. **Token Expiration**: Tokens expire after a set time period
6. **Login Notifications**: Users are notified of new logins

## Testing

### Test Email Verification
1. Register a new account
2. Check email for verification link
3. Click link or visit `/verify-email/:token`
4. Try logging in before and after verification

### Test Password Reset
1. Go to `/forgot-password`
2. Enter your email
3. Check email for reset link
4. Click link or visit `/reset-password/:token`
5. Set new password

### Test Rate Limiting
1. Try logging in with wrong password 6 times
2. Should see rate limit error after 5 attempts

### Test Account Lockout
1. Try logging in with wrong password 5 times
2. Account should be locked for 30 minutes
3. Try logging in again - should see lockout message

## Troubleshooting

### Emails not sending
- Check email configuration in `.env`
- Verify email credentials are correct
- Check spam folder
- In development, check console output

### Verification link expired
- Request a new verification email
- Tokens expire after 24 hours

### Account locked
- Wait 30 minutes for automatic unlock
- Or reset password to unlock immediately

### Rate limit errors
- Wait 1 minute before trying again
- Rate limit is per IP address

## Production Considerations

1. **Email Service**: Use a production email service (SendGrid, Mailgun, AWS SES)
2. **Frontend URL**: Update `FRONTEND_URL` to your production domain
3. **Rate Limits**: Adjust rate limits based on your needs
4. **Token Expiration**: Adjust token expiration times as needed
5. **Email Templates**: Consider using HTML email templates for better UX
6. **Monitoring**: Set up monitoring for failed email sends


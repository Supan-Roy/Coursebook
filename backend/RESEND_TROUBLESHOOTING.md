# Resend Email Not Delivering - Troubleshooting

## Issue: Emails show in logs but not delivered, daily count not increasing

This usually means Resend is receiving the email but not delivering it due to sender verification.

## Solution 1: Verify Sender Email in Resend Dashboard

1. Go to Resend Dashboard → **Emails** → **Senders**
2. Click **Add Sender**
3. Enter: `noreply@supanroy.com`
4. Verify the email address (Resend will send a verification email)
5. Once verified, use this email as `DEFAULT_FROM_EMAIL`

## Solution 2: Use Resend's Default Test Email (Quick Fix)

For testing, you can use Resend's default sender:
- Change `DEFAULT_FROM_EMAIL` to: `onboarding@resend.dev`
- This works immediately without verification
- **Note:** This is only for testing, not production

## Solution 3: Check Resend Dashboard Status

1. Go to **Domains** → `supanroy.com`
2. Check if **"Enable Sending"** is toggled ON (green)
3. Verify all DNS records are verified (DKIM, SPF)
4. Check if domain status shows "Verified" (not "Pending")

## Solution 4: Check Email Logs in Resend

1. Go to **Logs** in Resend dashboard
2. Click on the email that was sent
3. Check the status:
   - **"Delivered"** = Email reached recipient server (check spam)
   - **"Bounced"** = Email was rejected (check reason)
   - **"Pending"** = Email is queued
   - **"Failed"** = Check error message

## Solution 5: Test with Different Recipient

Try sending to a different email provider:
- Gmail
- Outlook
- Yahoo
- Your own domain email

## Common Issues:

1. **Sender not verified** - Most common issue
2. **Domain not fully verified** - Check all DNS records
3. **Email in spam** - Check recipient's spam folder
4. **Rate limiting** - Resend has 2 requests/second limit
5. **Invalid recipient** - Email address doesn't exist

## Quick Test:

Update your `.env` temporarily:
```env
DEFAULT_FROM_EMAIL=onboarding@resend.dev
```

Then test again. If this works, the issue is sender verification.


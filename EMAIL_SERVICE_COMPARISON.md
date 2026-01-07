# Email Service Comparison - Maximum Free Emails

## 🏆 Best Options for Maximum Free Emails

### **1. Mailgun - RECOMMENDED 🥇**
**Free Tier: 100 emails/day = ~3,000 emails/month**

- ✅ **Excellent deliverability** - Best reputation
- ✅ **Production-ready** - Used by major companies
- ✅ SMTP and REST API support
- ✅ Domain verification (better deliverability)
- ✅ Sandbox domain for quick testing
- ✅ Good documentation
- ⚠️ Credit card may be required (but won't charge on free tier)
- ⚠️ Requires domain verification for best results

**Setup:**
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=postmaster@your-domain.mailgun.org
EMAIL_HOST_PASSWORD=your-mailgun-smtp-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

**Sign up:** [mailgun.com](https://www.mailgun.com/)

**Why Mailgun?**
- Most reliable and production-tested
- Excellent deliverability rates
- Professional-grade service
- Great for Django projects

---

### **2. Brevo (formerly Sendinblue) - Highest Free Limit 🥈**
**Free Tier: 300 emails/day = ~9,000 emails/month**

- ✅ **Highest free limit** - 300 emails per day
- ✅ No credit card required
- ✅ SMTP and API support
- ✅ Good deliverability
- ✅ Email templates included
- ✅ Analytics dashboard
- ⚠️ Requires sender verification
- ⚠️ Interface changes may cause setup issues

**Note:** Brevo has made recent changes to their interface, which may cause setup difficulties.

---

### **3. Resend - Modern & Developer-Friendly 🥉**
**Free Tier: 3,000 emails/month**

- ✅ 3,000 emails/month
- ✅ Modern API (great for developers)
- ✅ Excellent deliverability
- ✅ Beautiful email templates
- ✅ No credit card required
- ✅ Easy setup

**Setup:**
```env
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=resend
EMAIL_HOST_PASSWORD=your-resend-api-key
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

**Sign up:** [resend.com](https://resend.com/)

---

### **4. SendGrid - Reliable & Popular**
**Free Tier: 100 emails/day = ~3,000 emails/month**

- ✅ 100 emails/day = ~3,000/month
- ✅ Very reliable
- ✅ Good deliverability
- ✅ Widely used
- ✅ SMTP and API support
- ⚠️ Requires sender verification

**Setup:**
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

**Sign up:** [sendgrid.com](https://sendgrid.com/)

---

### **5. Gmail SMTP - Unlimited (Not Recommended for Production)**
**Free Tier: Unlimited (but has daily limits ~500/day)**

- ✅ Free and unlimited (technically)
- ✅ No signup needed
- ✅ Easy setup
- ❌ **Not recommended for production**
- ❌ Daily sending limits (~500 emails/day)
- ❌ Can get blocked if sending too many
- ❌ May go to spam
- ❌ Requires 2FA and app password

**Best for:** Development/testing only

---

## 📊 Quick Comparison Table

| Service | Free Emails/Month | Daily Limit | Credit Card | Best For |
|---------|------------------|-------------|-------------|----------|
| **Mailgun** | **~3,000** | 100/day | ⚠️ Maybe | **Production reliability** |
| **Brevo** | ~9,000 | 300/day | ❌ No | Maximum emails (setup issues) |
| **Resend** | 3,000 | ~100/day | ❌ No | Modern apps |
| **SendGrid** | ~3,000 | 100/day | ❌ No | Reliability |
| **Gmail** | Unlimited* | ~500/day | ❌ No | Testing only |

*Gmail has practical limits and is not recommended for production

---

## 🎯 Recommendation Based on Your Needs

### For Production Reliability: **Mailgun** 🏆 **RECOMMENDED**
- **3,000 emails/month** (100/day)
- **Best deliverability** - Most reliable service
- Production-tested and used by major companies
- Excellent for Django projects
- Domain verification for better results

### For Maximum Free Emails: **Brevo** 🥈
- **9,000 emails/month** (300/day)
- Highest free limit
- **Note:** Recent interface changes may cause setup issues
- No credit card required

### For Best Developer Experience: **Resend** 💻
- **3,000 emails/month**
- Modern API, great documentation
- Easy to integrate
- No credit card required

### For Established Service: **SendGrid** ✅
- **3,000 emails/month**
- Most established service
- Good deliverability
- No credit card required

---

## 💡 Pro Tips

1. **Start with Brevo** - Highest free limit (9,000/month)
2. **Use Mailgun for launch** - Get 5,000/month for first 3 months
3. **Combine services** - Use different services for different email types:
   - Brevo for verification emails
   - Mailgun for transactional emails
4. **Monitor usage** - Track your email sending to stay within limits
5. **Set up domain verification** - Better deliverability

---

## 🔧 Quick Setup Guide

### Brevo Setup (Recommended)

1. **Sign up at [brevo.com](https://www.brevo.com/)**
   - No credit card required

2. **Get SMTP Key**
   - Go to **SMTP & API** → **SMTP**
   - Click **Generate new SMTP key**
   - Copy the key

3. **Verify Sender**
   - Go to **Senders** → **Add a sender**
   - Verify your email address

4. **Add to .env**
   ```env
   EMAIL_HOST=smtp-relay.brevo.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your-email@example.com
   EMAIL_HOST_PASSWORD=your-brevo-smtp-key
   DEFAULT_FROM_EMAIL=noreply@yourdomain.com
   ```

5. **Test it:**
   ```bash
   cd backend
   python test_email.py
   ```

---

## 📈 Email Usage Estimation

For a typical Coursebook app:

- **User registration:** 1 email (verification)
- **Password reset:** 1 email (if requested)
- **Login notification:** 1 email (optional, can disable)

**Example scenarios:**

| Users/Month | Verification | Password Reset | Login Notif | Total | Best Service |
|-------------|-------------|----------------|-------------|-------|--------------|
| 100 | 100 | 20 | 0 | 120 | Any |
| 500 | 500 | 100 | 0 | 600 | Any |
| 1,000 | 1,000 | 200 | 0 | 1,200 | Any |
| 3,000 | 3,000 | 600 | 0 | 3,600 | Brevo |
| 5,000 | 5,000 | 1,000 | 0 | 6,000 | Brevo |
| 10,000 | 10,000 | 2,000 | 0 | 12,000 | Brevo + Mailgun |

**Note:** If you enable login notifications, multiply by 2-3x

---

## ✅ Final Recommendation

**For production: Use Mailgun** 🏆

- ✅ **3,000 emails/month** (100/day)
- ✅ **Best deliverability** - Most reliable
- ✅ Production-tested
- ✅ Excellent for Django projects
- ✅ Domain verification for better results
- ✅ Professional-grade service

**Setup time:** ~15 minutes (including domain verification)

**Why Mailgun over others?**
- Most reliable and trusted service
- Best deliverability rates (emails less likely to go to spam)
- Used by major companies
- Excellent documentation
- Great SMTP support for Django

---

## 🚀 Next Steps

1. Sign up for Brevo: [brevo.com](https://www.brevo.com/)
2. Get your SMTP credentials
3. Update your `.env` file
4. Test with `python test_email.py`
5. Deploy!

Need help setting up Brevo? Check `EMAIL_SETUP_GUIDE.md` for detailed instructions.


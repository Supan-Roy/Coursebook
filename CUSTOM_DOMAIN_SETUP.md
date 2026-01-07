# Custom Domain Setup Guide

## 🎯 Domain Configuration Overview

For a Django + React application, you'll typically use:

- **Main Domain** (e.g., `yourdomain.com`, `www.yourdomain.com`) → **Vercel** (Frontend)
- **API Subdomain** (e.g., `api.yourdomain.com`) → **Railway** (Backend)

This setup allows:
- Users visit `yourdomain.com` → See your React frontend
- Frontend calls `api.yourdomain.com` → Reaches your Django backend
- Clean separation of frontend and backend

---

## 📋 Step-by-Step Setup

### Step 1: Connect Main Domain to Vercel (Frontend)

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Click on **Settings** → **Domains**

2. **Add Your Domain**
   - Enter your domain: `yourdomain.com`
   - Click **Add**
   - Vercel will show you DNS records to add

3. **Configure DNS Records**
   - Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
   - Add these DNS records:

   **For root domain (`yourdomain.com`):**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```

   **For www subdomain (`www.yourdomain.com`):**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

   **OR use Vercel's nameservers (easier):**
   - In your domain registrar, change nameservers to:
     ```
     ns1.vercel-dns.com
     ns2.vercel-dns.com
     ```

4. **Wait for DNS Propagation**
   - Usually takes 5-60 minutes
   - Vercel will show "Valid Configuration" when ready

5. **Update Frontend Environment Variable**
   - In Vercel project settings → Environment Variables
   - Update `VITE_API_URL` to: `https://api.yourdomain.com`

---

### Step 2: Connect API Subdomain to Railway (Backend)

1. **Go to Railway Dashboard**
   - Navigate to your Django service
   - Click on **Settings** → **Networking**

2. **Add Custom Domain**
   - Click **"Generate Domain"** or **"Add Custom Domain"**
   - Enter: `api.yourdomain.com`
   - Railway will provide DNS records

3. **Configure DNS Records**
   - Go to your domain registrar
   - Add this DNS record:

   ```
   Type: CNAME
   Name: api
   Value: <railway-provided-value>.railway.app
   ```

   **OR if Railway provides an A record:**
   ```
   Type: A
   Name: api
   Value: <railway-ip-address>
   ```

4. **Update Railway Environment Variables**
   - In Railway service → Variables
   - Update `DJANGO_ALLOWED_HOSTS`:
     ```
     yourdomain.com,www.yourdomain.com,api.yourdomain.com
     ```
   - Update `FRONTEND_URL`:
     ```
     https://yourdomain.com
     ```
   - Update `CORS_ALLOWED_ORIGINS`:
     ```
     https://yourdomain.com,https://www.yourdomain.com
     ```

5. **Wait for DNS Propagation**
   - Railway will show status when domain is connected
   - Usually takes 5-60 minutes

---

## 🔧 Alternative: Single Domain Setup

If you prefer everything on one domain:

### Option A: Subdirectory (Frontend handles routing)
- Frontend: `yourdomain.com` (Vercel)
- Backend: `yourdomain.com/api` (Vercel serverless functions or Railway with reverse proxy)

**Not recommended** - More complex setup

### Option B: Subdomain (Recommended)
- Frontend: `yourdomain.com` (Vercel)
- Backend: `api.yourdomain.com` (Railway)

**Recommended** - Clean separation, easier to manage

---

## 📝 Complete Environment Variables

### Vercel (Frontend)
```env
VITE_API_URL=https://api.yourdomain.com
```

### Railway (Backend)
```env
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com
DATABASE_URL=${{Postgres.DATABASE_URL}}
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
FRONTEND_URL=https://yourdomain.com
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## 🔍 DNS Record Examples

### If using Cloudflare (Recommended for DNS)
```
Type: A
Name: @
Value: 76.76.21.21 (Vercel)
Proxy: Proxied (Orange cloud ON)

Type: CNAME
Name: www
Value: cname.vercel-dns.com
Proxy: Proxied (Orange cloud ON)

Type: CNAME
Name: api
Value: <railway-domain>.railway.app
Proxy: DNS only (Gray cloud OFF) - Important for API!
```

### If using GoDaddy/Namecheap
```
Type: A
Host: @
Points to: 76.76.21.21

Type: CNAME
Host: www
Points to: cname.vercel-dns.com

Type: CNAME
Host: api
Points to: <railway-domain>.railway.app
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] `yourdomain.com` loads your React frontend
- [ ] `www.yourdomain.com` redirects to `yourdomain.com` (or vice versa)
- [ ] `api.yourdomain.com` responds to API requests
- [ ] Frontend can make API calls to `api.yourdomain.com`
- [ ] SSL/HTTPS is working (automatic on Vercel/Railway)
- [ ] CORS is configured correctly
- [ ] Email verification links use correct domain

---

## 🧪 Testing Your Setup

1. **Test Frontend:**
   ```bash
   curl https://yourdomain.com
   # Should return your React app HTML
   ```

2. **Test Backend:**
   ```bash
   curl https://api.yourdomain.com/api/health/
   # Should return API response
   ```

3. **Test from Browser:**
   - Visit `https://yourdomain.com`
   - Open browser console (F12)
   - Check Network tab for API calls to `api.yourdomain.com`
   - Verify no CORS errors

---

## 🔒 SSL/HTTPS Notes

- **Vercel**: Automatically provides SSL certificates (Let's Encrypt)
- **Railway**: Automatically provides SSL certificates
- **No manual SSL setup needed** - Both platforms handle it automatically

---

## 🚨 Common Issues

### Issue: Domain not connecting
**Solution:**
- Wait 24-48 hours for DNS propagation
- Check DNS records are correct
- Verify nameservers are pointing to correct provider

### Issue: CORS errors
**Solution:**
- Ensure `CORS_ALLOWED_ORIGINS` includes your frontend domain
- Check `FRONTEND_URL` is correct
- Verify no trailing slashes in URLs

### Issue: API calls failing
**Solution:**
- Check `VITE_API_URL` in Vercel environment variables
- Verify `DJANGO_ALLOWED_HOSTS` includes API subdomain
- Check Railway logs for errors

### Issue: SSL certificate errors
**Solution:**
- Wait for automatic SSL provisioning (can take a few hours)
- Both Vercel and Railway handle SSL automatically
- Don't manually add SSL certificates

---

## 📚 Additional Resources

- [Vercel Custom Domain Docs](https://vercel.com/docs/concepts/projects/domains)
- [Railway Custom Domain Docs](https://docs.railway.app/guides/custom-domains)
- [Cloudflare DNS Setup](https://developers.cloudflare.com/dns/)

---

## 💡 Pro Tips

1. **Use Cloudflare for DNS** - Free, fast, and includes DDoS protection
2. **Enable Cloudflare Proxy for Frontend** - Better performance and security
3. **Keep API on DNS-only (no proxy)** - Direct connection to Railway
4. **Set up redirects** - Redirect `www` to root or vice versa
5. **Monitor DNS propagation** - Use tools like `dnschecker.org`

---

## 🎯 Summary

**Where to connect your custom domain:**

1. **Main domain (`yourdomain.com`)** → **Vercel** (Frontend)
2. **API subdomain (`api.yourdomain.com`)** → **Railway** (Backend)

Both platforms support custom domains and automatically handle SSL certificates. The setup is straightforward and usually takes 5-60 minutes for DNS propagation.


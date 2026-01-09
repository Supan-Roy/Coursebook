# Free Hosting Guide for Coursebook (Django + React)

This guide covers the best free hosting options for your Django backend and React frontend.

## 🎯 Recommended Stack (100% Free)

### **Option 1: Railway + Vercel (Best Overall) ⭐**

**Backend (Django):** Railway.app
- ✅ Free tier: $5 credit/month (usually enough for small apps)
- ✅ PostgreSQL database included
- ✅ Automatic deployments from GitHub
- ✅ Environment variables support
- ✅ Custom domains
- ✅ No credit card required for free tier

**Frontend (React):** Vercel
- ✅ Completely free
- ✅ Automatic deployments from GitHub
- ✅ Custom domains
- ✅ CDN included
- ✅ Perfect for React/Vite apps

**Email:** SendGrid (Free tier: 100 emails/day)
- ✅ Already covered in EMAIL_SETUP_GUIDE.md

---

### **Option 2: Render (All-in-One) ⭐**

**Backend + Frontend:** Render.com
- ✅ Free tier for both Django and React
- ✅ PostgreSQL database (free tier)
- ✅ Automatic deployments
- ✅ Environment variables
- ⚠️ Free tier spins down after 15 min inactivity (wakes on request)
- ⚠️ Requires credit card (but won't charge on free tier)

---

### **Option 3: Fly.io (Best Performance)**

**Backend (Django):** Fly.io
- ✅ Free tier: 3 shared VMs
- ✅ PostgreSQL included
- ✅ No spin-down (always on)
- ✅ Global edge network
- ✅ Great for Python apps

**Frontend (React):** Vercel or Netlify
- ✅ Both completely free

---

## 📋 Detailed Setup Instructions

### **Railway (Backend) Setup**

1. **Sign up at [railway.app](https://railway.app)**
   - Use GitHub to sign in

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your Coursebook repository

3. **Add PostgreSQL Database**
   - Click "+ New" → "Database" → "PostgreSQL"
   - Railway will create a database and provide connection string

4. **Configure Environment Variables**
   - Go to your Django service → "Variables"
   - Add these variables:
   ```env
   DJANGO_SECRET_KEY=your-production-secret-key-here
   DJANGO_DEBUG=False
   DJANGO_ALLOWED_HOSTS=your-app.railway.app,yourdomain.com
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
   FRONTEND_URL=https://your-frontend.vercel.app
   CORS_ALLOW_ALL_ORIGINS=False
   CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```

5. **Configure Build Settings**
   - Railway auto-detects Django
   - **If using Dockerfile:** Railway will automatically use `backend/Dockerfile` (includes Ghostscript)
   - **If not using Docker:** Add build command: `pip install -r requirements.txt`
   - Add start command: `python manage.py migrate && python manage.py collectstatic --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
   
   **Note:** For PDF compression to work optimally, use the Dockerfile (includes Ghostscript). See `backend/GHOSTSCRIPT_SETUP.md` for details.

6. **Add Gunicorn to requirements.txt**
   ```txt
   gunicorn==21.2.0
   ```

7. **Create Procfile (optional)**
   ```
   web: python manage.py migrate && python manage.py collectstatic --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
   ```

---

### **Vercel (Frontend) Setup**

1. **Sign up at [vercel.com](https://vercel.com)**
   - Use GitHub to sign in

2. **Import Your Project**
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the `frontend` folder as root directory

3. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add:
   ```env
   VITE_API_URL=https://your-backend.railway.app
   ```

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically

---

### **Render (All-in-One) Setup**

#### Backend Setup:

1. **Sign up at [render.com](https://render.com)**
   - Use GitHub to sign in

2. **Create Web Service (Django)**
   - Click "New" → "Web Service"
   - Connect your GitHub repo
   - Settings:
     - **Name:** coursebook-backend
     - **Environment:** Docker (recommended) or Python 3
     - **If Docker:** Render will use `backend/Dockerfile` automatically (includes Ghostscript)
     - **If Python 3:** Build Command: `apt-get update && apt-get install -y ghostscript && cd backend && pip install -r requirements.txt`
     - **Start Command:** `cd backend && python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
     - **Root Directory:** backend
   
   **Note:** For optimal PDF compression, use Docker or install Ghostscript in build command. See `backend/GHOSTSCRIPT_SETUP.md` for details.

3. **Add PostgreSQL Database**
   - Click "New" → "PostgreSQL"
   - Name: coursebook-db
   - Plan: Free

4. **Link Database to Web Service**
   - In your web service → "Environment"
   - Add: `DATABASE_URL` → Copy from PostgreSQL service

5. **Add Environment Variables**
   ```env
   DJANGO_SECRET_KEY=your-secret-key
   DJANGO_DEBUG=False
   DJANGO_ALLOWED_HOSTS=your-app.onrender.com
   DATABASE_URL=${{postgres.DATABASE_URL}}
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=apikey
   EMAIL_HOST_PASSWORD=your-sendgrid-api-key
   DEFAULT_FROM_EMAIL=noreply@yourdomain.com
   FRONTEND_URL=https://your-frontend.onrender.com
   CORS_ALLOWED_ORIGINS=https://your-frontend.onrender.com
   ```

#### Frontend Setup:

1. **Create Static Site (React)**
   - Click "New" → "Static Site"
   - Connect your GitHub repo
   - Settings:
     - **Name:** coursebook-frontend
     - **Root Directory:** frontend
     - **Build Command:** `npm install && npm run build`
     - **Publish Directory:** dist

2. **Add Environment Variables**
   ```env
   VITE_API_URL=https://your-backend.onrender.com
   ```

---

## 🔧 Required Code Changes

### 1. Add Gunicorn to requirements.txt

```txt
gunicorn==21.2.0
whitenoise==6.6.0
```

### 2. Update settings.py for Production

Add to `backend/config/settings.py`:

```python
# Static files (WhiteNoise for production)
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Security settings for production
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
```

### 3. Update MIDDLEWARE

Add WhiteNoise to middleware (after SecurityMiddleware):

```python
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # Add this
    "corsheaders.middleware.CorsMiddleware",
    # ... rest of middleware
]
```

### 4. Create runtime.txt (for Render/Railway)

Create `backend/runtime.txt`:
```
python-3.11.0
```

### 5. Update CORS Settings

In `backend/config/settings.py`, ensure:
```python
CORS_ALLOW_ALL_ORIGINS = env.bool("CORS_ALLOW_ALL_ORIGINS", default=False)
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])
```

---

## 📊 Comparison Table

| Platform | Backend | Frontend | Database | Free Tier | Spin Down | Best For |
|----------|---------|----------|----------|-----------|-----------|----------|
| **Railway** | ✅ | ✅ | ✅ PostgreSQL | $5 credit/mo | ❌ No | Best overall |
| **Render** | ✅ | ✅ | ✅ PostgreSQL | Free | ⚠️ 15 min | All-in-one |
| **Fly.io** | ✅ | ❌ | ✅ PostgreSQL | 3 VMs | ❌ No | Performance |
| **Vercel** | ❌ | ✅ | ❌ | Free | ❌ No | Frontend only |
| **Netlify** | ❌ | ✅ | ❌ | Free | ❌ No | Frontend only |
| **Heroku** | ✅ | ✅ | ✅ | ❌ Discontinued | - | Not recommended |

---

## 🚀 Quick Start (Railway + Vercel)

### Step 1: Prepare Backend

1. Add to `backend/requirements.txt`:
   ```
   gunicorn==21.2.0
   whitenoise==6.6.0
   ```

2. Update `backend/config/settings.py` (add WhiteNoise middleware)

3. Commit and push to GitHub

### Step 2: Deploy Backend (Railway)

1. Sign up at railway.app
2. New Project → Deploy from GitHub
3. Add PostgreSQL database
4. Add environment variables
5. Deploy!

### Step 3: Deploy Frontend (Vercel)

1. Sign up at vercel.com
2. Import GitHub repo
3. Set root directory to `frontend`
4. Add `VITE_API_URL` environment variable
5. Deploy!

---

## 💰 Cost Breakdown (100% Free)

- **Backend (Railway):** $5 credit/month (usually enough)
- **Frontend (Vercel):** Free forever
- **Database (Railway PostgreSQL):** Included in credit
- **Email (SendGrid):** 100 emails/day free
- **File Storage (Cloudinary):** Free tier available
- **Total:** $0/month ✅

---

## ⚠️ Important Notes

1. **Railway Free Tier:**
   - $5 credit/month
   - Usually enough for small apps
   - Monitor usage in dashboard

2. **Render Free Tier:**
   - Spins down after 15 min inactivity
   - First request after spin-down takes ~30 seconds
   - Good for testing, consider paid for production

3. **Database:**
   - Use PostgreSQL in production (not SQLite)
   - Railway/Render provide free PostgreSQL
   - Update `DATABASE_URL` in environment variables

4. **Static Files:**
   - Use WhiteNoise for serving static files
   - Run `collectstatic` during deployment

5. **Environment Variables:**
   - Never commit `.env` to GitHub
   - Set all variables in hosting platform

6. **CORS:**
   - Set `CORS_ALLOWED_ORIGINS` to your frontend URL
   - Don't use `CORS_ALLOW_ALL_ORIGINS=True` in production

---

## 🔒 Security Checklist

- [ ] `DJANGO_DEBUG=False` in production
- [ ] Strong `DJANGO_SECRET_KEY` (generate new one)
- [ ] `ALLOWED_HOSTS` includes your domain
- [ ] `CORS_ALLOWED_ORIGINS` set correctly
- [ ] SSL/HTTPS enabled (automatic on Railway/Vercel)
- [ ] Environment variables set in hosting platform
- [ ] Database credentials secure
- [ ] Cloudinary credentials secure

---

## 📚 Additional Resources

- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)

---

## 🎯 Recommendation

**For your Coursebook project, I recommend:**

1. **Railway** for backend (best free tier, no spin-down)
2. **Vercel** for frontend (perfect for React, free forever)
3. **SendGrid** for email (100 emails/day free)
4. **Cloudinary** for file storage (free tier available)

This combination gives you:
- ✅ No spin-down delays
- ✅ Automatic deployments
- ✅ Free tier that's actually usable
- ✅ Professional-grade hosting
- ✅ Easy scaling when needed

**Total cost: $0/month** 🎉


# 🚀 Deployment Guide: Coursebook to Railway (Backend) & Vercel (Frontend)

This guide will help you deploy the Coursebook application to production.

## 📋 Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Railway Account** - Sign up at [railway.app](https://railway.app)
3. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
4. **Cloudinary Account** - Sign up at [cloudinary.com](https://cloudinary.com) (for file storage)
5. **OpenRouter Account** - Sign up at [openrouter.ai](https://openrouter.ai) (for AI features)

---

## 🔧 Part 1: Backend Deployment (Railway)

### Step 1: Prepare Your Repository

1. Ensure your `backend/` folder contains:
   - `requirements.txt`
   - `Procfile`
   - `manage.py`
   - All Django apps

2. Make sure `.env` is in `.gitignore` (never commit secrets!)

### Step 2: Deploy to Railway

1. **Login to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "Login" and authenticate with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your Coursebook repository
   - **IMPORTANT**: After creating the project, go to Settings → Root Directory
   - Set Root Directory to: `backend`
   - This tells Railway where your Django project is located

3. **Configure Environment Variables**
   - Go to your project → Variables tab
   - Add the following variables:

   ```env
   # Django Settings
   DJANGO_DEBUG=False
   DJANGO_SECRET_KEY=<generate-a-secure-random-key>
   DJANGO_ALLOWED_HOSTS=<your-railway-domain>.up.railway.app

   # Database (Railway provides this automatically)
   # DATABASE_URL is auto-provided by Railway PostgreSQL

   # CORS Settings
   CORS_ALLOW_ALL_ORIGINS=False
   CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app

   # Cloudinary Storage
   CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
   CLOUDINARY_API_KEY=<your-cloudinary-api-key>
   CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>

   # OpenRouter API
   OPENROUTER_API_KEY=<your-openrouter-api-key>

   # Email Configuration (Optional)
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=<your-email@gmail.com>
   EMAIL_HOST_PASSWORD=<your-app-password>
   DEFAULT_FROM_EMAIL=<your-email@gmail.com>
   FRONTEND_URL=https://your-vercel-app.vercel.app

   # Google OAuth (Optional)
   GOOGLE_OAUTH2_CLIENT_ID=<your-google-client-id>
   GOOGLE_OAUTH2_CLIENT_SECRET=<your-google-client-secret>
   ```

4. **Add PostgreSQL Database**
   - In Railway project, click "+ New"
   - Select "Database" → "Add PostgreSQL"
   - Railway will automatically set `DATABASE_URL` environment variable

5. **Deploy**
   - Railway will automatically detect your project (uses `nixpacks.toml` or `Dockerfile`)
   - If you see "Error creating build plan", ensure Root Directory is set to `backend`
   - Railway will use `Procfile` for the start command
   - Wait for deployment to complete
   - Note your Railway domain (e.g., `your-app.up.railway.app`)

**Note**: Railway will automatically:
   - Detect Python project
   - Install system dependencies (Ghostscript, Tesseract) via `nixpacks.toml`
   - Use `Procfile` for the start command
   - Or use `Dockerfile` if preferred (set in Settings → Deploy → Dockerfile Path)

### Step 3: Generate Secret Key

Generate a secure Django secret key:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Copy the output and use it as `DJANGO_SECRET_KEY` in Railway.

### Step 4: Verify Backend Deployment

1. Visit `https://your-railway-app.up.railway.app/api/`
2. You should see a JSON response
3. Test an endpoint: `https://your-railway-app.up.railway.app/api/courses/`

---

## 🎨 Part 2: Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

1. Ensure `frontend/` folder contains:
   - `package.json`
   - `vite.config.js`
   - `vercel.json` (already created)

2. Create `.env.production` file (or use Vercel environment variables):

   ```env
   VITE_API_URL=https://your-railway-app.up.railway.app/api
   ```

### Step 2: Deploy to Vercel

1. **Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Sign Up" and authenticate with GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Vite
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

3. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add:
     ```
     VITE_API_URL = https://your-railway-app.up.railway.app/api
     ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Note your Vercel domain (e.g., `your-app.vercel.app`)

### Step 3: Update Backend CORS

1. Go back to Railway
2. Update environment variable:
   ```
   CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
   ```
3. Redeploy backend (Railway auto-redeploys on env var changes)

---

## 🔐 Part 3: Configure Services

### Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard
3. Copy:
   - Cloud Name
   - API Key
   - API Secret
4. Add to Railway environment variables

### OpenRouter Setup (for AI features)

1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Get your API key from dashboard
3. Add `OPENROUTER_API_KEY` to Railway environment variables

### Email Setup (Optional)

1. **Gmail Setup:**
   - Enable 2-Factor Authentication
   - Generate App Password: [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Use app password as `EMAIL_HOST_PASSWORD`

2. **Add to Railway:**
   - `EMAIL_HOST_USER`: your Gmail address
   - `EMAIL_HOST_PASSWORD`: your app password
   - `DEFAULT_FROM_EMAIL`: your Gmail address

---

## ✅ Part 4: Post-Deployment Checklist

### Backend (Railway)

- [ ] Database migrations ran successfully
- [ ] Static files collected
- [ ] Environment variables set correctly
- [ ] CORS allows frontend domain
- [ ] API endpoints accessible
- [ ] Cloudinary configured
- [ ] OpenRouter API key set

### Frontend (Vercel)

- [ ] Build completes successfully
- [ ] Environment variable `VITE_API_URL` set
- [ ] Frontend loads without errors
- [ ] Can make API calls to backend
- [ ] Authentication works
- [ ] File uploads work

### Testing

1. **Test Authentication:**
   - Register a new account
   - Login
   - Check JWT tokens work

2. **Test File Upload:**
   - Upload a file to a course
   - Verify it appears in the course

3. **Test API:**
   - Check browser console for errors
   - Verify CORS headers are correct

---

## 🐛 Troubleshooting

### Backend Issues

**Problem: Migration errors**
- Solution: Check Railway logs, ensure database is connected

**Problem: Static files not loading**
- Solution: Verify `collectstatic` runs in Procfile

**Problem: CORS errors**
- Solution: Check `CORS_ALLOWED_ORIGINS` includes your Vercel domain

**Problem: Database connection failed**
- Solution: Verify `DATABASE_URL` is set by Railway

### Frontend Issues

**Problem: API calls fail**
- Solution: Check `VITE_API_URL` is correct in Vercel environment variables

**Problem: Build fails**
- Solution: Check Vercel build logs, ensure all dependencies are in `package.json`

**Problem: 404 on routes**
- Solution: Verify `vercel.json` rewrites are configured correctly

---

## 🔄 Updating Your Deployment

### Backend Updates

1. Push changes to GitHub
2. Railway auto-deploys on push
3. Check Railway logs for errors

### Frontend Updates

1. Push changes to GitHub
2. Vercel auto-deploys on push
3. Check Vercel build logs

---

## 📝 Important Notes

1. **Never commit `.env` files** - Use environment variables in Railway/Vercel
2. **Keep secrets secure** - Rotate keys regularly
3. **Monitor logs** - Check Railway and Vercel logs for errors
4. **Database backups** - Railway provides automatic backups for PostgreSQL
5. **Custom domains** - Both Railway and Vercel support custom domains

---

## 🆘 Support

If you encounter issues:

1. Check Railway deployment logs
2. Check Vercel build logs
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly
5. Ensure CORS is configured properly

---

## 🎉 You're Done!

Your Coursebook app should now be live at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.up.railway.app/api`

Happy deploying! 🚀


# 🔧 Railway Deployment Fix

## Problem: "Error creating build plan with Nixpacks"

This error occurs when Railway can't properly detect your project structure.

## ✅ Solution Applied

1. **Removed `railway.json`** - Railway auto-detection works better
2. **Created `nixpacks.toml`** - Explicit build configuration
3. **Procfile is still used** - Railway will use it for the start command

## 🚀 How to Deploy on Railway

### Step 1: Set Root Directory

1. In Railway dashboard, go to your service
2. Click on **Settings**
3. Under **Root Directory**, set it to: `backend`
4. Save changes

### Step 2: Deploy

Railway will now:
- Detect Python project
- Use `nixpacks.toml` for build
- Use `Procfile` for start command
- Install system dependencies (Ghostscript, Tesseract)

### Alternative: If Still Having Issues

**Option A: Use Dockerfile (Recommended)**
- Railway will automatically detect `backend/Dockerfile`
- No additional configuration needed
- Just set root directory to `backend`

**Option B: Manual Build Command**
1. Go to Railway service → Settings
2. Set **Build Command**: `pip install -r requirements.txt`
3. Set **Start Command**: `python manage.py migrate && python manage.py collectstatic --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120`

## 📝 Important Settings in Railway

1. **Root Directory**: Must be set to `backend`
2. **Environment Variables**: Add all from `QUICK_DEPLOY_CHECKLIST.md`
3. **PostgreSQL**: Add as a service (Railway auto-sets `DATABASE_URL`)

## ✅ Verification

After deployment, check:
- [ ] Build completes successfully
- [ ] Service is running (green status)
- [ ] API accessible at `https://your-app.up.railway.app/api/`
- [ ] No errors in Railway logs


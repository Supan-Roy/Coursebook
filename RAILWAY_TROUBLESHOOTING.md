# 🔧 Railway Troubleshooting Guide

## Error: "Error creating build plan with Nixpacks"

### ✅ Solution 1: Set Root Directory (Most Common Fix)

1. Go to Railway Dashboard → Your Service
2. Click **Settings** tab
3. Scroll to **Root Directory**
4. Set it to: `backend`
5. Click **Save**
6. Redeploy

### ✅ Solution 2: Use Dockerfile Instead

Railway can use your existing `Dockerfile`:

1. Go to Railway Dashboard → Your Service
2. Click **Settings** tab
3. Under **Deploy**, find **Dockerfile Path**
4. Set it to: `backend/Dockerfile`
5. Save and redeploy

### ✅ Solution 3: Manual Build Configuration

If auto-detection still fails:

1. Go to Railway Dashboard → Your Service
2. Click **Settings** tab
3. Under **Build**:
   - **Build Command**: `pip install -r requirements.txt`
4. Under **Deploy**:
   - **Start Command**: `python manage.py migrate && python manage.py collectstatic --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120`

### ✅ Solution 4: Check File Structure

Ensure these files exist in `backend/`:
- ✅ `manage.py`
- ✅ `requirements.txt`
- ✅ `Procfile`
- ✅ `config/settings.py`
- ✅ `nixpacks.toml` (created for you)

## Other Common Issues

### Build Fails: "Module not found"
- **Fix**: Check `requirements.txt` has all dependencies
- **Verify**: `django-cloudinary-storage` is included (already added)

### Build Fails: "Command not found: gunicorn"
- **Fix**: Ensure `gunicorn` is in `requirements.txt` (already included)

### Service Crashes: "Port already in use"
- **Fix**: Railway sets `$PORT` automatically, ensure Procfile uses it

### Database Connection Error
- **Fix**: Ensure PostgreSQL service is added and `DATABASE_URL` is set automatically

### Static Files Not Loading
- **Fix**: `collectstatic` runs in Procfile, ensure WhiteNoise is in requirements.txt (already included)

## Quick Fix Checklist

- [ ] Root Directory set to `backend` in Railway Settings
- [ ] All environment variables added (see QUICK_DEPLOY_CHECKLIST.md)
- [ ] PostgreSQL database service added
- [ ] Build logs show successful pip install
- [ ] Service shows "Active" status

## Still Having Issues?

1. Check Railway build logs for specific error messages
2. Verify all files are committed to GitHub
3. Try using Dockerfile method (Solution 2)
4. Check Railway status page: https://status.railway.app


# 🚀 Quick Deployment Checklist

## Before Deploying

### Backend (Railway) Environment Variables

Copy these to Railway → Your Project → Variables:

```env
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<generate-with-command-below>
DJANGO_ALLOWED_HOSTS=<your-railway-domain>.up.railway.app
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://<your-vercel-app>.vercel.app
CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
OPENROUTER_API_KEY=<your-openrouter-api-key>
FRONTEND_URL=https://<your-vercel-app>.vercel.app
```

**Generate Secret Key:**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Frontend (Vercel) Environment Variables

Add to Vercel → Your Project → Settings → Environment Variables:

```env
VITE_API_URL=https://<your-railway-app>.up.railway.app/api
```

## Deployment Steps

### 1. Railway (Backend)
1. ✅ Connect GitHub repo
2. ✅ Select `backend` as root directory
3. ✅ Add PostgreSQL database
4. ✅ Add all environment variables above
5. ✅ Deploy and note the domain

### 2. Vercel (Frontend)
1. ✅ Connect GitHub repo
2. ✅ Set root directory to `frontend`
3. ✅ Framework: Vite
4. ✅ Add `VITE_API_URL` environment variable
5. ✅ Deploy and note the domain

### 3. Update CORS
1. ✅ Go back to Railway
2. ✅ Update `CORS_ALLOWED_ORIGINS` with your Vercel domain
3. ✅ Redeploy backend

## Test After Deployment

- [ ] Backend API accessible: `https://your-app.up.railway.app/api/`
- [ ] Frontend loads: `https://your-app.vercel.app`
- [ ] Can register/login
- [ ] Can upload files
- [ ] No CORS errors in browser console

## Common Issues

**CORS Error?**
- Check `CORS_ALLOWED_ORIGINS` includes your Vercel domain (with https://)
- Make sure no trailing slash

**API Not Working?**
- Check `VITE_API_URL` in Vercel matches Railway domain
- Check Railway logs for errors

**Build Fails?**
- Check Railway/Vercel build logs
- Ensure all dependencies in requirements.txt/package.json


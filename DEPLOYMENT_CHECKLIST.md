# Quick Deployment Checklist

## ✅ Pre-Deployment Setup

### 1. Code Changes (Already Done)
- [x] Added `gunicorn` and `whitenoise` to `requirements.txt`
- [x] Added WhiteNoise middleware to `settings.py`
- [x] Added production security settings
- [x] Created `runtime.txt` for Python version
- [x] Created `Procfile` for deployment commands

### 2. Environment Variables to Set

**Backend (Railway/Render):**
```env
DJANGO_SECRET_KEY=<generate-new-secret-key>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-app.railway.app,yourdomain.com
DATABASE_URL=<provided-by-platform>
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

**Frontend (Vercel):**
```env
VITE_API_URL=https://your-backend.railway.app
```

### 3. Generate Secret Key
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 4. Test Locally First
```bash
# Backend
cd backend
python manage.py collectstatic --noinput
gunicorn config.wsgi:application

# Frontend
cd frontend
npm run build
npm run preview
```

## 🚀 Deployment Steps

### Railway (Backend)
1. Sign up at railway.app
2. New Project → Deploy from GitHub
3. Add PostgreSQL database
4. Set all environment variables
5. Deploy!

### Vercel (Frontend)
1. Sign up at vercel.com
2. Import GitHub repo
3. Set root directory to `frontend`
4. Add `VITE_API_URL` environment variable
5. Deploy!

## 🔍 Post-Deployment Testing

- [ ] Backend API accessible
- [ ] Frontend loads correctly
- [ ] User registration works
- [ ] Email verification sends
- [ ] Login works
- [ ] File uploads work (Cloudinary)
- [ ] CORS configured correctly
- [ ] HTTPS/SSL working
- [ ] Static files loading

## 📝 Notes

- Railway provides $5 credit/month (usually enough)
- Vercel is free forever
- SendGrid free tier: 100 emails/day
- Cloudinary has free tier for file storage


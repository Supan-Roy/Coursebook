# 🌐 How to Find Your Railway Domain

## Step-by-Step Guide

### Method 1: After First Deployment (Easiest)

1. **Deploy your project first** (even without env vars, it will try to start)
2. **Go to Railway Dashboard** → Your Project
3. **Click on your service** (the web service, not the database)
4. **Look at the top** - You'll see:
   - **Service URL** or **Public Domain**
   - It will look like: `your-app-name.up.railway.app`
5. **Copy that domain** - That's your `DJANGO_ALLOWED_HOSTS` value

### Method 2: Settings Tab

1. **Go to Railway Dashboard** → Your Project
2. **Click on your service**
3. **Click "Settings" tab**
4. **Scroll to "Domains" section**
5. **You'll see your domain listed there**

### Method 3: Deployment Logs

1. **Go to Railway Dashboard** → Your Project
2. **Click on your service**
3. **Click "Deployments" tab**
4. **Click on the latest deployment**
5. **Check the logs** - Railway often prints the domain

### Method 4: Generate Custom Domain

1. **Go to Railway Dashboard** → Your Project
2. **Click on your service**
3. **Click "Settings" tab**
4. **Scroll to "Domains"**
5. **Click "Generate Domain"** if you haven't already
6. **Copy the generated domain**

## Example

If your Railway domain is: `coursebook-production.up.railway.app`

Then set:
```
DJANGO_ALLOWED_HOSTS=coursebook-production.up.railway.app
```

## ⚠️ Important Notes

- **Don't include `https://`** - Just the domain name
- **Don't include trailing slash** - Just `domain.up.railway.app`
- **You can add multiple domains** - Separate with commas: `domain1.up.railway.app,domain2.up.railway.app`
- **The domain might change** - If you redeploy or change service name

## Quick Check

After setting `DJANGO_ALLOWED_HOSTS`, test it:
- Visit: `https://your-domain.up.railway.app/api/`
- You should see a JSON response (or Django REST framework welcome page)
- If you get a 400 Bad Request, the domain in `ALLOWED_HOSTS` doesn't match


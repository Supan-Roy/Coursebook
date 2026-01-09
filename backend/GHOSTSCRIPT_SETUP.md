# Ghostscript Setup Guide for PDF Compression

Ghostscript is required for optimal PDF compression. This guide shows how to install it on various hosting platforms.

## 🎯 Why Ghostscript?

Ghostscript provides **much better PDF compression** than PyMuPDF alone:
- Image downsampling and recompression
- Font subsetting
- Duplicate image detection
- Advanced optimization

**Note:** The compression service will automatically fall back to PyMuPDF if Ghostscript is not available, but compression will be less effective.

---

## 📦 Installation by Platform

### **1. Railway (Recommended)**

Railway uses Docker or Nixpacks. Ghostscript is automatically installed if you use Docker.

**Option A: Using Dockerfile (Recommended)**
1. Create `backend/Dockerfile` (already created)
2. Railway will automatically detect and use it
3. Ghostscript will be installed during build

**Option B: Using Nixpacks (No Dockerfile)**
Add to your Railway project settings:
- **Build Command:** `apt-get update && apt-get install -y ghostscript && pip install -r requirements.txt`
- Or add a `nixpacks.toml` file (see below)

---

### **2. Render**

**For Docker deployments:**
- Use the provided `Dockerfile` - Ghostscript will be installed automatically

**For Native Python deployments:**
Add to your Render service settings:
- **Build Command:** `apt-get update && apt-get install -y ghostscript && cd backend && pip install -r requirements.txt`

Or create `render.yaml`:
```yaml
services:
  - type: web
    name: coursebook-backend
    env: python
    buildCommand: apt-get update && apt-get install -y ghostscript && pip install -r requirements.txt
    startCommand: gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

---

### **3. Fly.io**

Fly.io uses Docker. The `Dockerfile` will work automatically.

If you need to customize, create `fly.toml`:
```toml
[build]
  dockerfile = "backend/Dockerfile"

[env]
  PORT = "8000"
```

---

### **4. Heroku**

Heroku uses buildpacks. Add the Apt buildpack:

1. Install Heroku CLI
2. Run:
```bash
heroku buildpacks:add --index 1 heroku-community/apt
```

3. Create `Aptfile` in project root:
```
ghostscript
```

4. Deploy:
```bash
git push heroku main
```

---

### **5. DigitalOcean App Platform**

1. Use the provided `Dockerfile`
2. Or add to build command:
   ```
   apt-get update && apt-get install -y ghostscript && pip install -r requirements.txt
   ```

---

### **6. AWS Elastic Beanstalk / EC2**

**For EC2 (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install -y ghostscript
```

**For Elastic Beanstalk:**
Create `.ebextensions/ghostscript.config`:
```yaml
packages:
  yum:
    ghostscript: []
```

---

### **7. Google Cloud Run / App Engine**

**Cloud Run (Docker):**
- Use the provided `Dockerfile` - works automatically

**App Engine (Standard):**
- Not supported (no system package installation)
- Use Cloud Run instead

---

### **8. Azure App Service**

**For Linux App Service:**
Create `startup.sh`:
```bash
#!/bin/bash
apt-get update
apt-get install -y ghostscript
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

Or use Docker with the provided `Dockerfile`.

---

## 🔍 Verify Ghostscript Installation

After deployment, check if Ghostscript is available:

```bash
# SSH into your server or use Railway/Render shell
gs --version
# Should output: GPL Ghostscript X.XX.X
```

Or check in Django shell:
```python
import subprocess
result = subprocess.run(['gs', '--version'], capture_output=True)
print(result.stdout.decode())
```

---

## 🛠️ Fallback Behavior

If Ghostscript is not available:
- ✅ Compression will still work using PyMuPDF
- ⚠️ Compression ratio will be lower (typically 10-30% vs 30-70% with Ghostscript)
- ✅ No errors - automatic fallback

The compression service logs which method is used:
```
INFO: Ghostscript compression (medium): 1000000 -> 500000 bytes (50.0% reduction)
# OR
INFO: Ghostscript compression failed or unavailable, falling back to PyMuPDF
```

---

## 📝 Quick Setup Checklist

- [ ] Create `backend/Dockerfile` (already done)
- [ ] For Railway: Dockerfile is auto-detected ✅
- [ ] For Render: Use Dockerfile or add to build command
- [ ] For Fly.io: Dockerfile works automatically ✅
- [ ] For Heroku: Add Apt buildpack + Aptfile
- [ ] Test compression after deployment
- [ ] Check logs to verify Ghostscript is being used

---

## 🐛 Troubleshooting

**Problem:** "Ghostscript not found" error
- **Solution:** Make sure Ghostscript is installed in the build environment
- **Check:** Verify with `gs --version` command

**Problem:** Compression still not working well
- **Solution:** Check logs to see if Ghostscript is actually being used
- **Check:** Try different compression levels (low/medium/high)

**Problem:** Build fails on hosting platform
- **Solution:** Make sure the platform supports system package installation
- **Alternative:** Use Docker with the provided Dockerfile

---

## 💡 Alternative: Pure Python Solution

If you can't install Ghostscript, the fallback PyMuPDF compression will still work, just with lower compression ratios. For better results without Ghostscript, you could:

1. Use a cloud service API (like Adobe PDF Services)
2. Use a microservice for PDF compression
3. Accept lower compression ratios with PyMuPDF

But Ghostscript is the best free, open-source solution! 🚀


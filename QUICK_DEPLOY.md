# 🚀 Quick Start: back4app + Vercel Deployment

**TL;DR — Deploy in 5 minutes**

---

## 📋 Your Information

Before starting, have these ready:

```
Back4app Domain: https://______________.back4app.io
Vercel Domain: https://__________________.vercel.app
GitHub Repository: ____________________________
```

---

## 🏃 Quick Steps

### 1. Install Required Files for back4app

```bash
# Already created in your repo:
# ✅ Procfile - tells back4app how to run your app
# ✅ runtime.txt - specifies Python 3.11.5
# ✅ requirements.txt - all dependencies
```

### 2. Generate JWT Secret

```bash
openssl rand -hex 32
# Copy the output above 👆
```

### 3. Create back4app Account & Project

1. Go to https://www.back4app.com
2. Click **Create Application**
3. Name: `krypton` (or your choice)
4. Note your domain: `https://krypton.back4app.io`

### 4. Connect GitHub to back4app

1. In back4app: **Settings → Git**
2. Click **Connect GitHub**
3. Select your repository
4. Choose `main` branch
5. Enable **Auto-deploy on push**

### 5. Set Environment Variables in back4app

Go to **Settings → Environment Variables** and add:

```bash
SECRET_KEY=<paste-the-key-from-step-2>
APP_ENV=production
GEMINI_API_KEY=your_actual_key
ALLOWED_ORIGINS=https://yourapp.vercel.app
DATABASE_URL=<back4app sets this automatically>
```

### 6. Deploy Backend

```bash
git add Procfile runtime.txt
git commit -m "Add back4app deployment files"
git push origin main
```

Back4app auto-deploys. Check **Logs** to verify success.

### 7. Create Vercel Account & Project

1. Go to https://vercel.com
2. Click **New Project**
3. Select your GitHub repository
4. Click **Import**

### 8. Set Frontend Environment in Vercel

In **Settings → Environment Variables**, add:

```bash
VITE_API_BASE_URL=https://yourapp.back4app.io
```

Make sure it's set for **Production** environment.

Set **Root Directory**: `frontend`

### 9. Update CORS in back4app

After Vercel deploys (watch the dashboard):

1. Note your Vercel URL: `https://yourapp.vercel.app`
2. Go back to back4app → **Settings → Environment Variables**
3. Update `ALLOWED_ORIGINS`: `https://yourapp.vercel.app`
4. Wait for redeploy

### 10. Test Everything

Open https://yourapp.vercel.app and:

- ✅ Search for papers
- ✅ Check browser Network tab (calls to back4app)
- ✅ Login if you have auth enabled

---

## 🔗 Important Domains

| Name     | Value                          | Where              |
| -------- | ------------------------------ | ------------------ |
| Backend  | `https://yourapp.back4app.io`  | back4app Dashboard |
| Frontend | `https://yourapp.vercel.app`   | Vercel Dashboard   |
| Git      | `https://github.com/YOUR/REPO` | GitHub             |

---

## 📝 Configuration Summary

### back4app Environment Variables

```
SECRET_KEY ..................... Generated (openssl rand -hex 32)
APP_ENV ......................... production
ALLOWED_ORIGINS ................ (set to Vercel URL)
GEMINI_API_KEY ................. (your actual key)
```

### Vercel Environment Variables

```
VITE_API_BASE_URL .............. (set to back4app URL)
ROOT_DIRECTORY ................. frontend
BUILD_COMMAND .................. npm run build
```

---

## 🐛 If Something Breaks

### "Cannot reach backend"

1. Check if backend is deployed: `curl https://yourapp.back4app.io/api/health`
2. Check `VITE_API_BASE_URL` is correct in Vercel
3. Verify backend is running in back4app Logs

### "CORS error" in browser

1. Update `ALLOWED_ORIGINS` in back4app to match your Vercel URL
2. Redeploy backend (push to GitHub)
3. Wait 2 minutes for changes to take effect

### "Authentication failed"

1. Verify `SECRET_KEY` is the same everywhere
2. Clear browser localStorage: Open DevTools → Application → Local Storage → Delete
3. Try logging in again

---

## 📚 Full Guides

- [Full back4app + Vercel Guide](./BACK4APP_VERCEL_DEPLOYMENT.md)
- [General Deployment Guide](./DEPLOYMENT.md)

---

## ✅ This is Done

Once you see your app working at `https://yourapp.vercel.app` with backend at `https://yourapp.back4app.io`, congrats! 🎉

For production-grade monitoring, check out:

- back4app Logs: Dashboard → Logs tab
- Vercel Analytics: Project Settings → Analytics

# 🚀 Vercel Frontend Deployment Guide

Deploy your React + Vite frontend to Vercel in minutes.

---

## 📋 Pre-Deployment Checklist

✅ **Backend deployed** - krypton-ryngvlpb.b4a.run  
✅ **Frontend configured** - VITE_API_BASE_URL set  
✅ **Git repository** - Code pushed to GitHub  
✅ **CORS configured** - Backend allows frontend origin

---

## Step 1: Prepare Frontend Files

Verify all production files are in place:

```bash
cd frontend
ls -la
# Should see: .env.production, package.json, vite.config.js, src/, etc.
```

### Check Configuration

```bash
cat .env.production
# Should show:
# VITE_API_BASE_URL=https://krypton-ryngvlpb.b4a.run
```

---

## Step 2: Build Locally to Verify

```bash
cd frontend

# Install dependencies (if not already done)
npm install

# Build for production
npm run build

# Should create: dist/ folder with optimized files
ls -la dist/ | head -10
```

**Expected output:**

- Build completes without errors
- `dist/` folder created with `.js`, `.css`, `.html` files
- File sizes reasonable (~100-200KB for JS bundle)

---

## Step 3: Push to GitHub

Make sure everything is committed:

```bash
cd /path/to/Krypton

# Verify git status
git status

# Add any uncommitted changes
git add frontend/.env.production

# Commit
git commit -m "Configure frontend for Vercel deployment with back4app backend"

# Push to GitHub
git push origin main
```

---

## Step 4: Create Vercel Account & Project

### Option A: GitHub Deployment (Recommended)

1. Go to **https://vercel.com**
2. Click **Sign Up**
3. Choose **Sign up with GitHub**
4. Authorize Vercel to access your GitHub
5. Click **New Project**
6. Find and select your `krypton` repository
7. Click **Import**

### Option B: Manual Deployment

If you prefer not to connect GitHub:

1. Go to **https://vercel.com**
2. **New Project** → **Import from Git**
3. Enter GitHub/GitLab URL
4. Follow prompts

---

## Step 5: Configure Vercel Project Settings

### Framework & Build Settings

After importing, Vercel should auto-detect:

- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

**If not auto-detected, set manually:**

1. **Settings** tab
2. **Build & Development Settings**
3. **Framework**: Vite
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. **Root Directory**: `./frontend`
7. **Install Command**: `npm install`

### Environment Variables

1. **Settings** → **Environment Variables**
2. Add:
   ```
   VITE_API_BASE_URL=https://krypton-ryngvlpb.b4a.run
   ```
3. Set for: **Production**
4. Click **Save**

**Note**: Vercel reads environment variables during build for Vite apps.

---

## Step 6: Deploy

### Auto-Deploy (Recommended)

If GitHub connected, Vercel auto-deploys on push:

```bash
# Just push to GitHub
git push origin main

# Vercel auto-triggers build & deploy
```

Watch deployment in [Vercel Dashboard](https://vercel.com/dashboard)

### Manual Deploy

If not using GitHub:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel

# Follow prompts:
# - Select your project
# - Confirm build settings
# - Deploy to production

# Vercel shows your URL
```

---

## Step 7: Verify Deployment

### Check Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Check **Deployments** tab
4. Latest deployment should be **READY** (green checkmark)

### Test Frontend

**Your app is now live at:**

```
https://yourapp.vercel.app
```

Or if you have a custom domain:

```
https://yourdomain.com
```

### Test API Connection

1. Open **https://yourapp.vercel.app**
2. Open browser DevTools
3. **Network** tab
4. Try searching or logging in
5. Verify API calls go to:
   ```
   https://krypton-ryngvlpb.b4a.run/api/...
   ```
6. Responses should come back (200 OK)

---

## Step 8: Update Backend CORS (If Needed)

If you get CORS errors in browser, update backend ALLOWED_ORIGINS:

1. Go to **back4app Dashboard**
2. **Settings** → **Environment Variables**
3. Find `ALLOWED_ORIGINS`
4. Add your Vercel URL:
   ```
   ALLOWED_ORIGINS=https://yourapp.vercel.app
   ```
5. Save (triggers redeploy)
6. Test frontend again

---

## 📊 Deployment Configuration

| Setting              | Value                              |
| -------------------- | ---------------------------------- |
| **Framework**        | Vite + React                       |
| **Build Command**    | `npm run build`                    |
| **Output Directory** | `dist`                             |
| **Root Directory**   | `frontend`                         |
| **Backend URL**      | `https://krypton-ryngvlpb.b4a.run` |
| **Node Version**     | 18.x (default)                     |

---

## 🔄 Redeployment

### Update Frontend

```bash
# Make changes in frontend code
# Commit and push to GitHub
git add frontend/src/
git commit -m "Update: new feature"
git push origin main

# Vercel auto-deploys!
```

### Rebuild

```bash
# In Vercel Dashboard
# Select project → Deployments
# Find latest deployment
# Click "..." → "Redeploy"
```

---

## 🐛 Troubleshooting

### Build fails with "not found"

**Error**: `Error: ENOENT: no such file or directory`

**Fix**:

```bash
# Ensure root directory is set to: ./frontend
# In Vercel Settings → Project Settings
```

### Build fails with "missing dependencies"

**Error**: `Cannot find module 'react'`

**Fix**:

```bash
# In Vercel Settings → Build & Development Settings
# Install Command: npm install --legacy-peer-deps
```

### Frontend can't reach backend

**Error**: "Cannot reach backend", CORS errors

**Fix**:

1. Verify `VITE_API_BASE_URL` in Vercel env vars
2. Verify backend `ALLOWED_ORIGINS` includes Vercel URL
3. Wait 2-3 minutes for caches to clear
4. Hard refresh browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

### Site shows blank page

**Cause**: Build succeeded but app won't load

**Fix**:

1. Open browser DevTools → **Console** tab
2. Look for JavaScript errors
3. Check API calls are going to correct backend
4. Verify `--legacy-peer-deps` if dependency conflicts

---

## ✅ Success Indicators

After deployment, you should see:

✅ **Vercel Dashboard** shows "READY" (green)
✅ **App loads** at https://yourapp.vercel.app
✅ **API calls** go to https://krypton-ryngvlpb.b4a.run
✅ **Health check** returns 200 OK
✅ **Responses** complete without CORS errors

---

## 🔗 Your Deployment URLs

```
Frontend: https://yourapp.vercel.app
Backend:  https://krypton-ryngvlpb.b4a.run
Database: MongoDB (managed by back4app)
```

---

## 📝 Environment Setup Reference

| Component    | Environment | Value                            |
| ------------ | ----------- | -------------------------------- |
| Frontend Dir | Vercel      | ./frontend                       |
| API URL      | Vercel      | https://krypton-ryngvlpb.b4a.run |
| Backend      | back4app    | https://krypton-ryngvlpb.b4a.run |
| Build Tool   | Vite        | npm run build                    |
| Port (Dev)   | Local       | 5173                             |
| Port (Prod)  | Vercel      | 443 (HTTPS)                      |

---

## 🎯 Next Steps

1. ✅ Fix `.env.production` (already done)
2. ⏭️ Push to GitHub
3. ⏭️ Create Vercel project
4. ⏭️ Set environment variables
5. ⏭️ Deploy
6. ⏭️ Test API connection
7. ⏭️ Update CORS if needed

---

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)
- [React + Vite Guide](https://vitejs.dev/guide/why.html#supported-framework-plugins)
- [Vercel CLI Reference](https://vercel.com/docs/cli)

**Your frontend is ready for Vercel! 🚀**

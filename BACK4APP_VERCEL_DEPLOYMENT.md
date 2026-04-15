# 🚀 Deployment Guide: back4app (Backend) + Vercel (Frontend)

This guide covers deploying your Research Assistant AI Agent to **back4app** (backend) and **Vercel** (frontend).

---

## 📋 Pre-Deployment Checklist

- [ ] back4app account created at https://www.back4app.com
- [ ] Vercel account created at https://vercel.com
- [ ] GitHub repository connected to Vercel
- [ ] GitHub repository connected to back4app
- [ ] SQLite migrated to **Parse Server + MongoDB** (included with back4app)
- [ ] Environment variables configured in both platforms
- [ ] CORS origins updated to match domains
- [ ] JWT secret key generated and securely stored
- [ ] Frontend built and tested locally before deploying

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│  Vercel (Frontend)                      │
│  - React + Vite app                    │
│  - Static hosting + serverless functions│
│  - Domain: https://yourapp.vercel.app  │
└────────────────┬────────────────────────┘
                 │
                 │ HTTPS API calls
                 ↓
┌─────────────────────────────────────────┐
│  back4app (Backend + Database)          │
│  - FastAPI (Python) server              │
│  - Parse Server with MongoDB            │
│  - Domain: https://yourapp.back4app.io │
└─────────────────────────────────────────┘
```

---

## 1️⃣ Backend Deployment: back4app

### Step 1: Create back4app Account

1. Go to https://www.back4app.com
2. Sign up / Log in
3. Create a new app: **Dashboard → Create Application**
4. Choose your app name (e.g., `krypton`)

### Step 2: Connect GitHub Repository

1. In back4app: **Settings → Git**
2. Connect your GitHub repository
3. Select the main branch
4. Enable auto-deploy on push

### Step 3: Prepare Backend for back4app

back4app expects a `package.json` or Cloud Code setup. Since we have FastAPI (Python), we need to set up a custom runtime:

#### Create `server.js` (entry point for back4app):

```bash
# In project root (alongside app/ and frontend/ folders)
cat > server.js << 'EOF'
// back4app requires a Node.js entry point
// We'll proxy to the Python FastAPI backend

const express = require('express');
const app = express();

// back4app Parse Server is automatically provisioned
// Your FastAPI will run as a separate dyno

console.log("back4app Parse Server ready");
app.listen(process.env.PORT || 1337);
EOF
```

#### Create `Procfile`:

```bash
cat > Procfile << 'EOF'
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
EOF
```

#### Update `requirements.txt`:

```bash
# Ensure all dependencies are listed
pip freeze > requirements.txt
```

#### Create `runtime.txt`:

```bash
cat > runtime.txt << 'EOF'
python-3.11.5
EOF
```

### Step 4: Configure Environment Variables in back4app

1. Go to **Settings → Environment Variables**
2. Add the following:

```bash
# Critical Security
SECRET_KEY=3bf13a49f95767c884734a935c87eb7e6ad8775d569059d55200b63f20e8f26d

# App Config
APP_ENV=production
APP_VERSION=1.0.0

# API Keys
GEMINI_API_KEY=your_gemini_api_key_here
SEMANTIC_SCHOLAR_API_KEY=

# CORS - Update to your Vercel domain
ALLOWED_ORIGINS=https://yourapp.vercel.app,https://www.yourapp.vercel.app

# Cache
CACHE_TTL_MINUTES=30

# Search Settings
MAX_RESULTS_DEFAULT=20
MAX_RESULTS_LIMIT=50

# Database URL (MongoDB)
# back4app provides this automatically - typically:
# DATABASE_URL=mongodb://...
# Check back4app dashboard for exact connection string
```

### Step 5: Deploy to back4app

```bash
# Push to GitHub main branch
git add .
git commit -m "Deploy to back4app"
git push origin main

# back4app auto-deploys on push
# Monitor deployment in back4app Dashboard → Logs
```

### Step 6: Get Your back4app Backend URL

1. Go to back4app Dashboard
2. **Settings → Domain**
3. You'll see: `https://yourapp.back4app.io` (or custom domain)
4. Copy this URL - **you'll need it for frontend**

### Step 7: Test Backend

```bash
# Test health check (replace with your actual domain)
curl https://yourapp.back4app.io/api/health

# Should return:
# {"status": "OK", "env": "production", ...}
```

---

## 2️⃣ Frontend Deployment: Vercel

### Step 1: Create Vercel Account & Connect Repository

1. Go to https://vercel.com
2. Sign up / Log in
3. **New Project → Import Git Repository**
4. Select your GitHub repository
5. Click **Import**

### Step 2: Configure Environment Variables in Vercel

1. Go to **Project Settings → Environment Variables**
2. Add:

```
VITE_API_BASE_URL=https://yourapp.back4app.io
```

Replace `yourapp` with your actual back4app domain name.

**Important**: Make sure this is set for **Production** environment.

### Step 3: Configure Build Settings

Vercel should auto-detect Vite. Verify settings:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `frontend/dist`
- **Root Directory**: `frontend`

If not auto-detected, set manually:

1. **Settings → Build & Development Settings**
2. **Framework**: Vite
3. **Build Command**: `cd frontend && npm run build`
4. **Output Directory**: `frontend/dist`
5. **Install Command**: `cd frontend && npm install`

### Step 4: Deploy Frontend

```bash
# Push to GitHub
git add .
git commit -m "Deploy frontend to Vercel"
git push origin main

# Vercel auto-deploys
# Watch deployment at Vercel Dashboard
```

### Step 5: Get Your Vercel Frontend URL

After deployment:

1. Vercel Dashboard shows your URL: `https://yourapp.vercel.app`
2. Copy this URL

### Step 6: Update Backend CORS

Now that you have your Vercel domain, update back4app CORS:

1. Go to back4app Dashboard → **Settings → Environment Variables**
2. Update `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS=https://yourapp.vercel.app
   ```
3. Redeploy backend (push to GitHub)

### Step 7: Test Frontend

1. Open https://yourapp.vercel.app
2. Open browser DevTools → **Network** tab
3. Try to search or login
4. Verify API calls go to `https://yourapp.back4app.io`
5. Should see successful responses (200 status)

---

## 🔐 Security Configuration

### Environment Variables by Platform

**back4app (Backend):**

```bash
SECRET_KEY=<unique-secret-generated-with-openssl>
APP_ENV=production
GEMINI_API_KEY=<your-actual-key>
ALLOWED_ORIGINS=https://yourapp.vercel.app,https://www.yourapp.vercel.app
```

**Vercel (Frontend):**

```bash
VITE_API_BASE_URL=https://yourapp.back4app.io
```

### Secrets Management

**Never commit `.env` files to GitHub.**

For both platforms:

- Use platform-specific environment variable management (not `.env` files)
- Store secrets in:
  - back4app: Dashboard → Settings → Environment Variables
  - Vercel: Project Settings → Environment Variables
- Rotate keys periodically
- Use separate keys for dev/staging/production

---

## 📊 Database: Parse Server + MongoDB

### Why MongoDB on back4app?

✅ **Advantages:**

- Auto-managed by back4app (no setup needed)
- Replaces SQLite (no data loss on restart)
- Scales to multiple instances
- Automatic backups
- High availability

### Migration from SQLite to MongoDB

**Current setup (SQLite):**

```python
DATABASE_URL = "sqlite+aiosqlite:///./research_agent.db"
```

**With back4app Parse Server:**

```python
# back4app provides DATABASE_URL environment variable
# Extract from environment (back4app sets this automatically)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./research_agent.db")
```

**Code changes needed:**

1. Update `app/database.py`:

```python
import os
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./research_agent.db")

# For MongoDB via SQLAlchemy:
# Install: pip install sqlalchemy-mongodb
# URL: mongodb+srv://user:pass@cluster.mongodb.net/database

engine = create_async_engine(DATABASE_URL, echo=False)
```

2. Install MongoDB driver:

```bash
pip install sqlalchemy-mongodb
```

3. Commit and push to back4app (auto-redeploys)

---

## 🔧 CORS Setup (Critical!)

### The CORS Problem

When backend and frontend are on different domains:

- **Frontend**: `https://yourapp.vercel.app`
- **Backend**: `https://yourapp.back4app.io`

Browser blocks requests unless backend explicitly allows the origin.

### Solution

In back4app environment variables:

```bash
ALLOWED_ORIGINS=https://yourapp.vercel.app,https://www.yourapp.vercel.app
```

The FastAPI middleware in `app/main.py` already handles this:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=cfg.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Debugging CORS Issues

If you see "CORS error" in browser:

1. **Check Vercel domain** matches in CORS
2. **Open browser DevTools** → Network tab
3. **Look for response headers**:
   ```
   Access-Control-Allow-Origin: https://yourapp.vercel.app
   ```
4. **Check backend logs** for CORS config
5. **Redeploy backend** if you changed CORS

---

## 🐛 Troubleshooting

### Frontend shows "Cannot reach backend"

**Cause**: `VITE_API_BASE_URL` is wrong or backend is down

**Fix**:

```javascript
// In browser console:
console.log(import.meta.env.VITE_API_BASE_URL);
// Should show: https://yourapp.back4app.io

// Try manually:
fetch("https://yourapp.back4app.io/api/health")
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);
```

### "CORS error" in browser

**Cause**: Frontend domain not in `ALLOWED_ORIGINS`

**Fix**:

1. Verify your Vercel URL
2. Update `ALLOWED_ORIGINS` in back4app
3. Redeploy backend
4. Wait 1-2 minutes for changes to take effect

### Authentication not working

**Cause**: `SECRET_KEY` mismatch between deployments

**Fix**:

1. Verify same `SECRET_KEY` in back4app environment
2. Clear browser localStorage: `localStorage.clear()`
3. Try login again

### Database errors / Data missing

**Cause**: SQLite was local, now using MongoDB

**Fix**:

1. Old SQLite data won't migrate automatically
2. If you need historical data, back it up before switching
3. Fresh MongoDB start is simpler for new deployments

---

## 🚀 Deployment Workflow

### For each change:

1. **Develop locally**:

   ```bash
   # Back in venv
   uvicorn app.main:app --reload

   # Frontend in another terminal
   cd frontend
   npm run dev
   ```

2. **Test locally**: Verify everything works

3. **Commit to GitHub**:

   ```bash
   git add .
   git commit -m "Your change description"
   git push origin main
   ```

4. **Auto-deploy**:
   - back4app: Auto-deploys on GitHub push (check Logs)
   - Vercel: Auto-deploys on GitHub push (check Dashboard)

5. **Verify in production**:
   - Frontend: https://yourapp.vercel.app
   - Backend: https://yourapp.back4app.io/api/health

---

## 📈 Monitoring

### back4app Logs

```bash
# View logs in dashboard
# Dashboard → Logs

# Or via CLI (if installed):
# b4a logs
```

### Vercel Deployment Logs

1. Dashboard → Select Project
2. **Deployments** tab
3. Click each deployment to see build/runtime logs

### Monitor Health

**Backend health check:**

```bash
curl https://yourapp.back4app.io/api/health -i
```

**Frontend availability:**

```bash
curl https://yourapp.vercel.app -i
# Should return 200
```

---

## 🔄 Rollback / Redeploy

### back4app

1. Dashboard → **Deployments** or **Git**
2. Select previous version
3. Click **Redeploy**

### Vercel

1. Dashboard → **Deployments**
2. Find previous successful deployment
3. Click **Redeploy**

---

## 💰 Pricing Considerations

### back4app

- Free tier includes Parse Server + MongoDB
- Auto-scales, pay for usage

### Vercel

- Free tier includes frontend hosting
- Bandwidth included
- $20/month for Pro features (not usually needed)

---

## 📝 Deployment Checklist

Before going live:

- [ ] Generate JWT secret: `openssl rand -hex 32`
- [ ] Set `SECRET_KEY` in back4app environment
- [ ] Backend domain noted (e.g., `https://app.back4app.io`)
- [ ] Set `VITE_API_BASE_URL` in Vercel to backend domain
- [ ] Update `ALLOWED_ORIGINS` in back4app to frontend domain
- [ ] Test API calls from frontend (browser DevTools)
- [ ] Test authentication (login/logout)
- [ ] Test search functionality
- [ ] Check logs for errors
- [ ] Test on mobile device
- [ ] Set up monitoring alerts

---

## 🎯 Next Steps

1. Create back4app account and app
2. Create Vercel account and connect GitHub
3. Configure environment variables in both
4. Deploy and test
5. Monitor for issues

**Support resources:**

- back4app docs: https://www.back4app.com/docs
- Vercel docs: https://vercel.com/docs
- FastAPI docs: https://fastapi.tiangolo.com

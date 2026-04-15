# 📁 Deployment Files Reference

This document explains all the deployment configuration files created for back4app + Vercel.

---

## Backend Deployment Files (back4app)

### 1. `Procfile`

**Purpose**: Tells back4app how to start your application

```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

- **Importance**: ⭐⭐⭐ **CRITICAL**
- **Status**: ✅ Created automatically
- **Notes**:
  - Specifies FastAPI as the web process
  - `$PORT` is injected by back4app
  - Must be in project root

### 2. `runtime.txt`

**Purpose**: Specifies Python version for back4app

```
python-3.11.5
```

- **Importance**: ⭐⭐ Important
- **Status**: ✅ Created automatically
- **Notes**:
  - Ensures consistent Python version
  - Must match `app/` requirements
  - Check back4app docs for available versions

### 3. `requirements.txt`

**Purpose**: Lists all Python dependencies

**Already existed** — Contains:

- FastAPI, uvicorn
- SQLAlchemy, aiosqlite
- Google Generative AI
- Authentication libraries (python-jose, passlib)

- **Importance**: ⭐⭐⭐ **CRITICAL**
- **Status**: ✅ Already exists
- **Notes**:
  - back4app uses this to install dependencies
  - Update whenever you add new packages

### 4. `.env.production` (or `.env.back4app`)

**Purpose**: Production environment variables for back4app

**Key variables**:

```bash
SECRET_KEY=3bf13a49f95767c884734a935c87eb7e6ad8775d569059d55200b63f20e8f26d
APP_ENV=production
ALLOWED_ORIGINS=https://yourapp.vercel.app
GEMINI_API_KEY=...
```

- **Importance**: ⭐⭐⭐ **CRITICAL**
- **Status**: ✅ Created for reference
- **Notes**:
  - **DO NOT commit** actual secrets to git
  - Set variables in back4app Dashboard instead
  - Each environment should have unique `SECRET_KEY`

### Setting up in back4app Dashboard

1. Go to **Settings → Environment Variables**
2. Add each variable from `.env.production`
3. Set them as **Production** environment
4. Click Save
5. Auto-redeploy happens on next push

---

## Frontend Deployment Files (Vercel)

### 1. `frontend/.env.production`

**Purpose**: Vercel production environment for frontend

**Key variables**:

```bash
VITE_API_BASE_URL=https://yourapp.vercel.app
```

- **Importance**: ⭐⭐⭐ **CRITICAL**
- **Status**: ✅ Created automatically
- **Notes**:
  - Vite reads this during build
  - Must point to your back4app backend
  - Browser-accessible (it's in built JS)

### Setting up in Vercel Dashboard

1. Go to **Project Settings → Environment Variables**
2. Add:
   ```
   VITE_API_BASE_URL=https://yourapp.back4app.io
   ```
3. Set for **Production** environment
4. Set **Root Directory** to `frontend`
5. Save and redeploy

### 2. `frontend/.env.example`

**Purpose**: Template showing available env variables

Contains:

```bash
# Example:
VITE_API_BASE_URL=http://localhost:8000
```

- **Importance**: ⭐ Reference only
- **Status**: ✅ Created automatically
- **Notes**:
  - Shows what variables are available
  - Safe to commit to git
  - Developers use this as a template

### 3. `frontend/.env` (Dev)

**Purpose**: Development environment variables

Contains:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

- **Importance**: ⭐⭐ Important (for local dev)
- **Status**: ✅ Created automatically
- **Notes**:
  - Used when running `npm run dev`
  - App talks to local backend (port 8000)
  - Should NOT be in git (but often is for dev convenience)

---

## Reference/Documentation Files

### 1. `DEPLOYMENT.md`

**Purpose**: Comprehensive deployment guide

Contains:

- Security issues (JWT, CORS, SQLite)
- Deployment options (Docker, Kubernetes, Cloud databases)
- Troubleshooting guide
- Pre-production checklist

- **Importance**: ⭐⭐⭐ Reference
- **When to use**: General deployment questions

### 2. `BACK4APP_VERCEL_DEPLOYMENT.md`

**Purpose**: Specific guide for back4app + Vercel stack

Contains:

- Step-by-step back4app setup
- Step-by-step Vercel setup
- CORS configuration
- Database setup (Parse Server + MongoDB)
- Troubleshooting for this specific stack

- **Importance**: ⭐⭐⭐ **PRIMARY REFERENCE**
- **When to use**: This is your go-to guide for deployment

### 3. `QUICK_DEPLOY.md`

**Purpose**: 5-minute quick start cheat sheet

Contains:

- TL;DR version of deployment steps
- Quick reference table
- Common issues and fixes

- **Importance**: ⭐⭐ Quick reference
- **When to use**: Fast lookup during deployment

### 4. `.env.example` (Root)

**Purpose**: Template for backend environment variables

Contains:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
SECRET_KEY=dev-insecure-key-please-change-in-production
```

- **Importance**: ⭐⭐ Template
- **Status**: ✅ Already exists
- **Notes**:
  - Safe to commit
  - Developers copy this to create `.env` locally

### 5. `.env.back4app`

**Purpose**: Reference template for back4app production setup

- **Importance**: ⭐ Reference only
- **Status**: ✅ Created for documentation
- **Notes**:
  - Shows what to set in back4app Dashboard
  - DO NOT commit actual secrets

---

## File Organization Summary

```
Krypton/
├── Procfile                          ← back4app: How to start app
├── runtime.txt                       ← back4app: Python version
├── requirements.txt                  ← All Python dependencies
│
├── .env.example                      ← Backend template (safe to commit)
├── .env.production                   ← Backend production setup
├── .env.back4app                     ← Reference: what to set in back4app
│
├── frontend/
│   ├── .env.example                  ← Frontend template (safe to commit)
│   ├── .env                          ← Frontend dev (local testing)
│   ├── .env.production               ← Frontend production (Vercel uses this)
│   └── .env.vercel                   ← Reference: what to set in Vercel
│
├── DEPLOYMENT.md                     ← General deployment guide
├── BACK4APP_VERCEL_DEPLOYMENT.md     ← Your specific stack guide ⭐
└── QUICK_DEPLOY.md                   ← Fast reference
```

---

## Deployment Workflow

### Step 1: Local Development

```bash
# Use these files:
# .env (backend local)
# frontend/.env (frontend local)

npm run dev          # Frontend at http://localhost:5173
uvicorn app.main:app --reload  # Backend at http://localhost:8000
```

### Step 2: Prepare for Production

```bash
# Ensure these exist:
# ✅ Procfile      (for back4app)
# ✅ runtime.txt   (for back4app)
# ✅ requirements.txt
# ✅ .env.production (for reference)
# ✅ frontend/.env.production (for Vercel build)
```

### Step 3: Set Secrets in Platforms

```bash
# back4app Dashboard → Environment Variables:
# - SECRET_KEY (from openssl rand -hex 32)
# - ALLOWED_ORIGINS (your Vercel URL)
# - GEMINI_API_KEY (your actual key)

# Vercel Dashboard → Environment Variables:
# - VITE_API_BASE_URL (your back4app URL)
```

### Step 4: Deploy

```bash
git push origin main
# back4app auto-deploys from GitHub
# Vercel auto-deploys from GitHub
```

---

## Critical Notes

### 🔒 Security

- **NEVER commit** actual secrets (API keys, SECRET_KEY) to git
- Use platform-specific secret managers:
  - back4app: Dashboard → Environment Variables
  - Vercel: Project Settings → Environment Variables
- Each environment should have unique `SECRET_KEY`

### 🔧 CORS Gotcha

- If `ALLOWED_ORIGINS` doesn't match frontend URL, CORS blocks requests
- Browser will show cryptic CORS errors
- Frontend will silently fail (no obvious error messages)
- **Solution**: Update `ALLOWED_ORIGINS` in back4app to your Vercel URL

### 💾 Database

- SQLite is **locally stored** - not suitable for deployment
- back4app provides MongoDB via Parse Server
- Data persists across restarts (unlike SQLite on local filesystem)
- No migration needed - same SQLAlchemy interface

### 📊 Debugging

1. **Check backend logs**: back4app Dashboard → Logs
2. **Check frontend logs**: Vercel Dashboard → Deployments → Build logs
3. **Check browser console**: DevTools → Network tab for API calls
4. **Test health**: `curl https://yourapp.back4app.io/api/health`

---

## File Checklist

Before deploying to back4app + Vercel:

- [ ] `Procfile` exists in root (tells back4app how to run)
- [ ] `runtime.txt` exists with Python version
- [ ] `requirements.txt` all dependencies listed
- [ ] `.env.production` has all variables documented
- [ ] `frontend/.env.production` has correct API URL
- [ ] Secrets set in back4app Dashboard (not in .env files)
- [ ] Secrets set in Vercel Dashboard (not in .env files)
- [ ] Both CORS and frontend API URL match domains
- [ ] Tested locally with `npm run dev` +`uvicorn`
- [ ] Tested API calls in browser DevTools

---

## Next Steps

1. **Read**: [BACK4APP_VERCEL_DEPLOYMENT.md](./BACK4APP_VERCEL_DEPLOYMENT.md)
2. **Create**: back4app account and link GitHub
3. **Create**: Vercel account and link GitHub
4. **Set**: Environment variables in both dashboards
5. **Deploy**: Push to GitHub (triggers auto-deploy)
6. **Test**: API calls from https://yourapp.vercel.app to https://yourapp.back4app.io

Questions? Check [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for troubleshooting.

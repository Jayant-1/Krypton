# CORS Configuration - Temporary Fix & Instructions

## Current Situation

**Backend URL**: https://krypton-ryngvlpb.b4a.run  
**Backend Port**: 8080 (Fixed ✅)  
**Frontend URL**: Unknown (not yet identified)  
**CORS Status**: ❌ MISCONFIGURED - Blocking frontend

---

## Quick Fix for Immediate Testing

If you want to quickly test whether CORS is the issue, you can temporarily allow all origins:

### Option A: Emergency Fix (Development Only)

**File**: `.env.production`

```yaml
# TEMPORARY - for testing only
ALLOWED_ORIGINS=*
```

⚠️ **WARNING**: This allows ANY origin. Only for testing!

### Option B: Proper Fix (Production)

**File**: `.env.production`

```yaml
# Set to your actual Vercel frontend URL
ALLOWED_ORIGINS=https://your-vercel-url.vercel.app
```

---

## Find Your Vercel Frontend URL

### Step 1: Check Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Look for project from GitHub: `Jayant-1/Krypton`
3. Copy the URL shown (usually `https://krypton-*.vercel.app`)

### Step 2: If Not Yet Deployed

1. Push code: `git push origin main`
2. Go to https://vercel.com/new
3. Import GitHub repo
4. Deploy
5. Copy the generated URL

---

## Applying the Fix

### Using the Helper Script

```bash
# Make sure in Krypton directory
cd /media/jayant/Jayant/Code/Work\ Station/Hackathon/Krypton

# Run with your Vercel URL
./cors-fix.sh https://your-vercel-url.vercel.app

# For example:
./cors-fix.sh https://krypton-frontend.vercel.app
```

This will:

- Update .env.production
- Show you next steps

### Manual Fix

1. Open `.env.production`
2. Find: `ALLOWED_ORIGINS=https://yourapp.vercel.app`
3. Replace with your actual URL
4. Save

### Deploy to back4app

1. Go to back4app Dashboard
2. Settings → Environment Variables
3. Update: `ALLOWED_ORIGINS=https://your-vercel-url.vercel.app`
4. Redeploy or restart backend

---

## Verification

### After applying fix:

1. Open frontend in browser
2. Press F12 (DevTools)
3. Network tab
4. Try making an API call (e.g., search)
5. Look for request to: `https://krypton-ryngvlpb.b4a.run/api/*`

**Expected**: Response status 200 or 400+ (not CORS error)  
**If CORS Error**: ALLOWED_ORIGINS still doesn't match your frontend domain

---

## Common Issues & Solutions

### "CORS header 'Access-Control-Allow-Origin' missing"

→ Likely ALLOWED_ORIGINS doesn't have your frontend URL

### "Status code: 400"

→ Backend received request but CORS header blocked it

### "Status code: (null)"

→ Network-level CORS error, frontend not allowed to reach backend

### "Backend offline on port 8000"

→ **FIXED** ✅ - Dockerfile now starts on port 8080

---

## Files Involved

- `.env.production` - ALLOWED_ORIGINS setting
- `app/main.py` - CORS middleware implementation
- `app/config.py` - Settings from environment
- `Dockerfile` - Updated with correct port ✅
- `cors-fix.sh` - Helper script for configuration

---

## What Each Component Does

### Frontend (.env.production)

```
VITE_API_BASE_URL=https://krypton-ryngvlpb.b4a.run
```

→ Frontend knows where backend is

### Backend (app/main.py)

```python
allow_origins=cfg.allowed_origins.split(",")
```

→ Backend checks if frontend domain is allowed

### Environment Variable

```
ALLOWED_ORIGINS=https://your-vercel-url.vercel.app
```

→ List of allowed frontend domains (comma-separated for multiple)

---

## Example Configurations

### Single Frontend (Most Common)

```
ALLOWED_ORIGINS=https://krypton-frontend.vercel.app
```

### Multiple Frontends

```
ALLOWED_ORIGINS=https://krypton-frontend.vercel.app,https://backup-frontend.vercel.app
```

### Development + Production

```
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://krypton-frontend.vercel.app
```

### Emergency Testing (Temporary Only)

```
ALLOWED_ORIGINS=*
```

---

## Summary of Port Changes

| Component      | Value | Status      |
| -------------- | ----- | ----------- |
| Dockerfile CMD | 8080  | ✅ Fixed    |
| HEALTHCHECK    | 8080  | ✅ Fixed    |
| EXPOSE         | 8080  | ✅ Fixed    |
| Procfile       | 8080  | ✅ Verified |
| frontend/.env  | 8080  | ✅ Verified |
| backend/.env   | 8080  | ✅ Default  |

---

## Testing Commands

```bash
# Check if backend is running
curl -v https://krypton-ryngvlpb.b4a.run/api/health

# Check current CORS setting
grep ALLOWED_ORIGINS .env.production

# Run helper script
./cors-fix.sh https://your-url.vercel.app

# Git status
git status

# Recent commits
git log --oneline | head -3
```

---

## Next Actions

1. **Identify Vercel URL** (check dashboard or deploy if needed)
2. **Run**: `./cors-fix.sh https://your-vercel-url.vercel.app`
3. **Commit**: `git add .env.production && git commit -m "Configure CORS for Vercel"`
4. **Update back4app**: Set ALLOWED_ORIGINS environment variable
5. **Test**: Open frontend → DevTools → Network tab → make API call

**Status**: Waiting for actual Vercel URL to complete CORS configuration

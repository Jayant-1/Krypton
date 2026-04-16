# 🔴 CRITICAL: back4app Health Check Configuration

**Status**: Dockerfile & Procfile fixed ✅ | back4app settings needed ⏳

---

## Problem

back4app deployment logs show health check failing on port 8000:
```
trying to hit the 8000 port using http
it looks that no process is listening to the 8000 port using http
app did not turn healthy after several checks
```

**Why This Happens**:
- back4app has built-in health check system
- It checks port 8000 by default
- Our app runs on port 8080
- Port mismatch → health check fails → deployment fails

---

## Solution: Configure PORT in back4app

### The Real Fix (Most Important)

Go to **back4app Dashboard** and set:

**Name**: `PORT`  
**Value**: `8080`

**Steps**:
1. Log in to https://back4app.com/dashboard
2. Select your app (Krypton)
3. → Settings → Environment Variables
4. Click "New" (or edit if PORT exists)
5. **Key**: `PORT`
6. **Value**: `8080`
7. Click "Save"
8. **Redeploy** (Manual Deployment in Dashboard)

**Why**: back4app's orchestration checks this PORT variable to know which port to health check on. When PORT=8080 is set, back4app will check port 8080 instead of port 8000.

---

## Code Changes (Already Applied ✅)

### Procfile (Updated)
```
web: uvicorn app.main:app --host 0.0.0.0 --port 8080
```
✅ Now explicitly starts on port 8080

### Dockerfile (Updated)
```dockerfile
EXPOSE 8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--log-level", "info"]
```
✅ Now explicitly exposes and runs on port 8080

### Why We Removed Environment Variables
The `${PORT:-8080}` approach doesn't work well with back4app's health check system. back4app checks port 8000 independently of environment variables.

---

## Complete Solution Workflow

### Step 1: Code Changes (DONE ✅)
- [x] Procfile hardcoded to 8080
- [x] Dockerfile hardcoded to 8080
- [x] Git commits ready

### Step 2: back4app Configuration (NEEDED NOW)
- [ ] Log into back4app dashboard
- [ ] Set `PORT=8080` in Environment Variables
- [ ] Redeploy

### Step 3: Verify Deployment
- [ ] Health check shows ✅ or 🟢
- [ ] Logs show: "Application startup complete"
- [ ] curl https://krypton-ryngvlpb.b4a.run/api/health returns 200

---

## Step-by-Step: Setting PORT in back4app

### 1. Access Dashboard
- Go to: https://back4app.com/dashboard
- Select your app "Krypton"

### 2. Navigate to Environment Variables
- Click: Settings (gear icon)
- Or: Settings → Environment Variables

### 3. Add/Update PORT Variable
Look for existing `PORT` variable:
- If exists: Click edit, change to `8080`
- If doesn't exist: Click "New" or "Add Variable"

### 4. Set Port
```
Key:   PORT
Value: 8080
```

### 5. Save
- Click save/confirm
- System might show: "Environment variables updated"

### 6. Redeploy Backend
- In back4app dashboard
- Find: "Manual Deployment" or "Deploy" button
- Click it
- Wait for deployment

### 7. Monitor Health Check
- Watch build logs
- Should see: "Health check passed" or similar
- If not: Check logs for errors

---

## What Each Environment Variable Does

| Variable | Purpose | Our Value |
|----------|---------|-----------|
| **PORT** | Which port to health check | **8080** ← SET THIS |
| DATABASE_PATH | SQLite location | /app/data/research_agent.db |
| ALLOWED_ORIGINS | CORS domains | https://yourapp.vercel.app |
| SECRET_KEY | JWT secret | Your generated key |
| GEMINI_API_KEY | AI service | Your API key |

---

## Debugging if Still Failing

### Check 1: Verify PORT is Set
In back4app dashboard:
- Settings → Environment Variables
- Search for "PORT"
- Should show: `PORT = 8080`

### Check 2: Verify Code Changes
```bash
# In your repo:
cat Procfile
# Should show: port 8080

grep "EXPOSE" Dockerfile
# Should show: EXPOSE 8080

grep "CMD" Dockerfile | grep uvicorn
# Should show: port 8080 (not variable)
```

### Check 3: Manual Deployment
- Even if auto-redeployed, manually trigger:
  - Dashboard → Manual Deployment
  - Or → "Redeploy on Master"

### Check 4: View Logs
In back4app dashboard:
- Logs tab
- Look for "trying to hit" behavior
- Should now check port 8080 (not 8000)
- Then show "Health check passed"

---

## How It Works Now

```
back4app deployment flow:
1. Sees Procfile: port 8080
2. Reads environment: PORT=8080
3. Starts container
4. Knows to check health on port 8080
5. Curls: http://localhost:8080/api/health
6. App responds: 200 OK ✅
7. Deployment succeeds ✅
```

---

## Git Commits

```
8461b51 CRITICAL FIX: Hardcode port 8080 - back4app health check requires explicit port configuration
```

**Changes**:
- Procfile: Removed `${PORT:-8080}`, now `8080`
- Dockerfile: Removed `${PORT:-8080}`, now hardcoded 8080

---

## Ready to Deploy?

### Checklist
- [x] Procfile hardcoded to 8080
- [x] Dockerfile hardcoded to 8080
- [x] Code committed and pushed
- [ ] PORT=8080 set in back4app
- [ ] Redeployed in back4app
- [ ] Health check passed

### What To Do Next

1. **Push to GitHub** (if not done):
   ```bash
   git push origin main
   ```

2. **Set PORT in back4app**:
   - Dashboard → Environment Variables
   - Add: `PORT=8080`
   - Save

3. **Redeploy**:
   - Dashboard → Manual Deployment
   - Or wait for auto-deployment after push

4. **Verify**:
   ```bash
   curl https://krypton-ryngvlpb.b4a.run/api/health
   ```
   Should return: `{"status": "OK"}`

---

## Reference: Port Configuration

| Component | Now | Before | Why Changed |
|-----------|-----|--------|-------------|
| Procfile | `8080` | `${PORT:-8080}` | back4app doesn't respect env var approach |
| Dockerfile CMD | `8080` | `${PORT:-8080}` | Simpler, more reliable for back4app |
| EXPOSE | 8080 | 8080 | No change |
| Front-end (local) | 8080 | 8080 | No change |
| Front-end (prod) | 443 | 443 | No change |

---

## Summary

✅ **Code is fixed** - port hardcoded to 8080  
⏳ **back4app needs config** - set PORT=8080 environment variable  
⏳ **Then redeploy** - back4app will health check on 8080  
⏳ **Then verify** - deployment should succeed  

**The Fix**: Just 2 minutes in back4app dashboard!

---

## Support

If deployment still fails after setting PORT=8080:
1. Check logs in back4app dashboard
2. Verify `PORT=8080` is actually set
3. Try manual redeploy
4. Check Docker image details (should show port 8080)

Most common issue: PORT variable not saved or old image still deployed.  
Solution: Set PORT, manual redeploy, give it 5 minutes to build.

---

**Critical Actions Needed**:
1. `git push origin main` (if code not pushed)
2. Set `PORT=8080` in back4app environment  
3. Redeploy backend
4. Verify health check passes

**Estimated Time**: 5 minutes

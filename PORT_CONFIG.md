# 🔧 Port Configuration Fix - Frontend ↔ Backend

## Problem

Frontend was configured to reach backend on port 8000, but backend runs on port 8080.

**Error Message:**

```
⚠ Cannot reach backend — is uvicorn running on port 8000?
```

---

## Solution Applied

### Local Development: Port 8080

**frontend/.env**

```
VITE_API_BASE_URL=http://localhost:8080
```

This matches where your backend server actually listens:

```bash
# Backend running:
uvicorn app.main:app --host 0.0.0.0 --port 8080
```

### Production: back4app

**frontend/.env.production**

```
VITE_API_BASE_URL=https://krypton-ryngvlpb.b4a.run
```

This is your deployed back4app URL (HTTPS on port 443, implicit).

---

## Port Reference

| Environment    | Frontend                   | Backend                          | Port | Protocol |
| -------------- | -------------------------- | -------------------------------- | ---- | -------- |
| **Local Dev**  | http://localhost:5173      | http://localhost:8080            | 8080 | HTTP     |
| **Docker**     | Not applicable             | http://0.0.0.0:8080              | 8080 | HTTP     |
| **Production** | https://yourapp.vercel.app | https://krypton-ryngvlpb.b4a.run | 443  | HTTPS    |

---

## Testing Locally

After fixing, test the connection:

```bash
# Terminal 1: Start backend
cd /path/to/Krypton
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Open http://localhost:5173 and try searching. Check browser DevTools Network tab - API calls should go to `http://localhost:8080/api/...`

**Expected:** Requests complete successfully (200 OK)

---

## Docker Configuration

When running via docker-compose:

```yaml
# Local development with docker
services:
  backend:
    ports:
      - "8080:8080"
```

Frontend inside docker also uses http://backend:8080 (service name resolution).

---

## backend Port Change History

- **Original**: Port 8000 (changed early in development)
- **Current**: Port 8080 (configured for back4app)
- **Procfile**: `web: uvicorn app.main:app --host 0.0.0.0 --port 8080`
- **Docker**: `CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--log-level", "info"]`

---

## Environment Variable Reference

### Development

```
# frontend/.env
VITE_API_BASE_URL=http://localhost:8080
```

### Production

```
# frontend/.env.production
VITE_API_BASE_URL=https://krypton-ryngvlpb.b4a.run
```

### Docker Compose

```yaml
environment:
  - DATABASE_PATH=/app/data/research_agent.db
  - PORT=8080 # Backend listens on this
```

---

## Quick Test

```bash
# Test backend is listening
curl http://localhost:8080/api/health

# Expected response
{"status": "OK", "version": "1.0.0"}
```

If connection refused, check:

- ✅ Backend process is running
- ✅ Port 8080 is not blocked
- ✅ Environment variable set correctly
- ✅ No firewall blocking localhost

---

## Configuration Files

| File                       | Port        | Purpose              |
| -------------------------- | ----------- | -------------------- |
| `frontend/.env`            | 8080        | Local development    |
| `frontend/.env.production` | 443 (HTTPS) | Vercel production    |
| `Procfile`                 | 8080        | back4app deployment  |
| `Dockerfile`               | 8080        | Container deployment |
| `docker-compose.yml`       | 8080        | Local Docker         |

All aligned to port 8080 for consistency.

---

## Commit Reference

Files updated to fix port mismatch:

- `frontend/.env` - Changed from 8000 to 8080
- `frontend/.env.production` - Added clarifying comment

Status: Ready for testing

# 🚀 Production Deployment Guide

This guide covers the critical security and configuration issues that must be addressed before deploying to production.

---

## 🔒 Issue 1: JWT Secret Key (Critical Security Flaw)

### Problem

If `SECRET_KEY` remains as the default insecure value, anyone can forge authentication tokens and impersonate any user.

### Solution

Generate a cryptographically-secure random key for production:

```bash
# Generate a 32-byte (256-bit) random hex string
openssl rand -hex 32
# Example output: 3f4e8a9c2b1d5f7e6a3c9b2d1f5e7a8c9b2d1f5e7a8c9b2d1f5e7a8c9b2d1f5
```

### Implementation

1. Run the command above and copy the output
2. Update your production `.env` file:
   ```
   SECRET_KEY=<paste-output-here>
   ```
3. **Never commit this key to version control** — keep it in production secrets only

### Verification

- ✅ Backend should NOT log warnings about insecure keys
- ✅ Tokens generated in production are cryptographically secure
- ✅ Each production environment should have a unique SECRET_KEY

---

## 🌐 Issue 2: Frontend Hardcoded API URL

### Problem

The frontend was hardcoded to `http://localhost:8000`, causing:

- Production app tries to query the user's own computer
- Silent failures without obvious errors
- App won't work when deployed

### Solution

Uses environment variables through Vite:

- **Development**: `VITE_API_BASE_URL=http://localhost:8000`
- **Production**: `VITE_API_BASE_URL=https://api.yourdomain.com`

### Implementation

#### For development:

```bash
# frontend/.env (already created)
VITE_API_BASE_URL=http://localhost:8000
```

#### For production:

```bash
# frontend/.env.production
VITE_API_BASE_URL=https://api.yourdomain.com
```

Then build for production:

```bash
cd frontend
npm run build  # Uses .env.production automatically
```

### Verification

Open browser DevTools → Network tab and verify API calls go to the correct domain.

---

## 🔐 Issue 3: CORS Configuration Blocking Production

### Problem

When `APP_ENV=production`, CORS allowed origins was set to an empty list `[]`, blocking ALL requests:

- Frontend requests would be rejected
- Errors appear in browser console, not shown to user
- App silently fails

### Solution

CORS is now configured from `ALLOWED_ORIGINS` environment variable:

```bash
# Development (.env)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Production (.env.production)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### CRITICAL: CORS must match frontend domain(s)

| Frontend Domain         | Backend ALLOWED_ORIGINS |
| ----------------------- | ----------------------- |
| `http://localhost:3000` | `http://localhost:3000` |
| `https://myapp.com`     | `https://myapp.com`     |
| `https://www.myapp.com` | `https://www.myapp.com` |

**If they don't match, the browser will block requests.**

### Implementation

1. Update `ALLOWED_ORIGINS` in `.env.production` with your actual domain(s)
2. Comma-separate multiple origins if needed
3. **Very important**: Include ALL variations (www/non-www, http/https)
4. Redeploy backend

### Debugging CORS Issues

```bash
# Check backend logs for CORS middleware
# Should see: CORS origin allowed: https://yourdomain.com

# In browser DevTools Console, check for:
# Access-Control-Allow-Origin header in response
```

---

## 💾 Issue 4: SQLite Data Loss in Containerized Deployments

### Problem

SQLite database (`research_agent.db`) is stored in the container's filesystem:

- **Container restart** → database resets
- **Scaling** (multiple container instances) → each has its own DB
- **Production deployment** → all user history and data lost

### Solution Options

#### Option A: Persistent Volume (Recommended for single-instance deployments)

Mount a persistent volume to `/app/data/`:

**Docker:**

```dockerfile
VOLUME ["/app/data"]
```

**docker-compose.yml:**

```yaml
services:
  backend:
    volumes:
      - research_data:/app/data
    environment:
      - DATABASE_PATH=/app/data/research_agent.db

volumes:
  research_data:
    driver: local
```

**Kubernetes:**

```yaml
volumeMounts:
  - name: data
    mountPath: /app/data
volumes:
  - name: data
    persistentVolumeClaim:
      claimName: research-data-pvc
```

#### Option B: PostgreSQL (Recommended for production/scaling)

Switch to PostgreSQL for:

- Multi-instance scaling
- Automatic backups
- High availability
- Better performance

**Required changes:**

1. Update `app/database.py`:
   ```python
   DATABASE_URL = os.getenv(
       "DATABASE_URL",
       "postgresql+asyncpg://user:pass@localhost/research_agent"
   )
   ```
2. Update `.env`:
   ```bash
   DATABASE_URL=postgresql+asyncpg://user:password@db-host:5432/research_agent
   ```
3. Install dependency: `pip install asyncpg`
4. No code changes needed (same SQLAlchemy interface)

#### Option C: Cloud Database (AWS RDS, Azure Database, etc.)

- Fully managed, automatic backups
- Pay-as-you-go pricing
- Zero infrastructure maintenance

### Current Deployment

If using **persistent volumes**, ensure:

1. Database directory is mounted as a volume
2. Container has read/write permissions
3. Volume is backed up regularly
4. Test restart scenario: data persists

### Migration Path

If you're currently using SQLite:

1. **Short term**: Use persistent volumes + regular backups
2. **Long term**: Plan migration to PostgreSQL or managed database
3. **Never**: Scale SQLite to multiple instances without fixing this

---

## 📋 Pre-Production Checklist

- [ ] **JWT Secret**: Generated with `openssl rand -hex 32` and set in `.env.production`
- [ ] **Frontend API URL**: Set `VITE_API_BASE_URL` in `frontend/.env.production`
- [ ] **CORS Origins**: Updated `ALLOWED_ORIGINS` to match your production domain(s)
- [ ] **Database**: Persistent volume OR switched to PostgreSQL
- [ ] **Secrets Rotation**: Never commit `.env.production` — use deployment secrets manager
- [ ] **HTTPS**: Frontend and backend both use `https://`
- [ ] **Logs**: Reviewed startup logs for warnings
- [ ] **Testing**: Tested API calls from production frontend URL

---

## 🚀 Deployment Steps

### Backend (Python/FastAPI)

```bash
# 1. Build container
docker build -t krypton-backend:latest .

# 2. Set production environment
export APP_ENV=production
export SECRET_KEY=<your-generated-key>
export ALLOWED_ORIGINS=https://yourdomain.com

# 3. Run with persistent volume
docker run -d \
  --name krypton-backend \
  -v research_data:/app/data \
  -e APP_ENV=production \
  -e SECRET_KEY=$SECRET_KEY \
  -e ALLOWED_ORIGINS=$ALLOWED_ORIGINS \
  -p 8000:8000 \
  krypton-backend:latest
```

### Frontend (Vite/React)

```bash
# 1. Update Vite config for production API
cd frontend
# Ensure .env.production exists with correct VITE_API_BASE_URL

# 2. Build
npm run build

# 3. Deploy dist/ folder to static hosting (Vercel, Netlify, S3, etc.)
# Or serve with nginx/apache
```

---

## 🔍 Monitoring & Logging

### Backend Health Check

```bash
curl https://yourdomain.com/api/health
```

### Check Production Settings

```bash
# In logs, look for:
# ✅ Env: production
# ✅ Secret key is set
# ✅ CORS origins configured
```

### Frontend Network Issues

```javascript
// Open browser console and check:
console.log(import.meta.env.VITE_API_BASE_URL);
// Should show production URL, not localhost
```

---

## ⚠️ Common Mistakes

❌ **Don't:**

- Hardcode `SECRET_KEY` anywhere
- Commit `.env.production` to git
- Use `localhost` in production
- Deploy without persistent volumes for SQLite
- Forget to update CORS for your domain

✅ **Do:**

- Use environment secrets manager (GitHub Secrets, GitLab CI, Vercel, etc.)
- Generate new keys for each environment
- Test CORS before going live
- Document your database backup strategy
- Monitor logs for CORS/auth errors

---

## 📞 Troubleshooting

### "Access denied" / CORS errors in browser

→ Check `ALLOWED_ORIGINS` matches your frontend domain exactly

### "Cannot reach backend" on production app

→ Check `VITE_API_BASE_URL` in frontend `.env.production`

### Tokens not validating

→ Ensure `SECRET_KEY` is the same on all backend instances

### Data disappears after restart

→ Implement persistent volume or switch to PostgreSQL

---

## 📚 References

- [FastAPI CORS docs](https://fastapi.tiangolo.com/tutorial/cors/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Docker Volumes](https://docs.docker.com/storage/volumes/)

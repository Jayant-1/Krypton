# 🔧 Container Startup Fix - Health Check Timeout

## Problem

Container builds successfully but fails health check:

```
The container exited before becoming healthy. Please check the container logs.
trying to hit the 8080 port using http
it looks that no process is listening to the 8080 port using http
http request to the 8080 port timed out after 2s
```

**Root Cause**: uvicorn wasn't starting - likely database initialization failure due to file permissions or missing directory.

---

## Solution Applied

### 1. **Database Path Resilience** (database.py)

**Before:**

```python
DATABASE_URL = "sqlite+aiosqlite:///./research_agent.db"  # Relative path, hard to manage
```

**After:**

```python
db_path = os.getenv("DATABASE_PATH", "./research_agent.db")
db_dir = Path(db_path).parent
db_dir.mkdir(parents=True, exist_ok=True)  # Ensure directory exists

DATABASE_URL = f"sqlite+aiosqlite:///{db_path}"
```

**Benefits:**

- ✅ Respects environment variables
- ✅ Auto-creates directory if missing
- ✅ Works in container and local development
- ✅ Graceful fallback to local path

### 2. **Container Environment Setup** (Dockerfile)

**Added:**

```dockerfile
# Create data directory for database
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/data && \
    chown -R appuser:appuser /app

# Set database path for container
ENV DATABASE_PATH=/app/data/research_agent.db
```

**Benefits:**

- ✅ Appuser can write to /app/data
- ✅ Database stored in writable location
- ✅ Persistent across container restarts (with volume mount)

### 3. **Verbose Logging** (Dockerfile + main.py)

**Dockerfile CMD:**

```dockerfile
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--log-level", "info"]
```

**main.py startup:**

```python
logger.info("DB : %s", os.getenv("DATABASE_PATH", "./research_agent.db"))
```

**Benefits:**

- ✅ Shows exact database path in logs
- ✅ Easier to debug startup issues
- ✅ Helps diagnose permission/initialization errors

### 4. **Docker Compose Update** (docker-compose.yml)

**Before:**

```yaml
volumes:
  - ./research_agent.db:/app/research_agent.db
```

**After:**

```yaml
environment:
  - DATABASE_PATH=/app/data/research_agent.db
volumes:
  - ./data:/app/data # Mount data directory
```

**Benefits:**

- ✅ Database stored in persistent volume
- ✅ Matches container setup
- ✅ Easy local development

---

## What This Fixes

| Issue                   | Fix                                       | Result                      |
| ----------------------- | ----------------------------------------- | --------------------------- |
| No process on port 8080 | Ensured directory exists before DB access | ✅ uvicorn starts           |
| Health check timeout    | Added verbose logging                     | ✅ Easier debugging         |
| File permission errors  | Set proper ownership (appuser)            | ✅ Can write to /app        |
| Database path issues    | Use environment-based paths               | ✅ Works in any environment |

---

## Testing the Fix

### Local Development

```bash
# Build and start
docker-compose up -d --build

# Check logs
docker-compose logs -f backend

# Should see:
# DB       : /app/data/research_agent.db
# 🚀  Research Assistant AI Agent — Backend

# Test health check
curl http://localhost:8080/api/health
```

### Production (back4app)

1. Push to GitHub: `git push origin main`
2. back4app auto-builds and deploys
3. Check back4app logs for:
   ```
   DB       : /app/data/research_agent.db
   Uvicorn running on 0.0.0.0:8080
   ```
4. Container should be HEALTHY

---

## Environment Variables

| Variable        | Default               | Purpose                              |
| --------------- | --------------------- | ------------------------------------ |
| `DATABASE_PATH` | `./research_agent.db` | Where to store SQLite database       |
| `PORT`          | `8080`                | Server port                          |
| `APP_ENV`       | `development`         | Environment (development/production) |
| `SECRET_KEY`    | N/A                   | JWT secret (required for production) |

**Example:**

```bash
docker run -e DATABASE_PATH=/app/data/research_agent.db \
           -e APP_ENV=production \
           -e SECRET_KEY=your_key \
           krypton-backend:latest
```

---

## File Changes Summary

| File                 | Change                                       | Impact                    |
| -------------------- | -------------------------------------------- | ------------------------- |
| `Dockerfile`         | Added /app/data directory, DATABASE_PATH env | Container can write to DB |
| `app/database.py`    | Support DATABASE_PATH env var                | Flexible DB location      |
| `app/main.py`        | Log actual DB path                           | Better debugging          |
| `docker-compose.yml` | Mount /app/data volume                       | Persistent DB in dev      |

---

## Troubleshooting

### Container still won't start

**Check logs:**

```bash
# Local
docker-compose logs backend

# back4app Dashboard → Logs
```

**Common issues:**

- Missing GEMINI_API_KEY → Set in environment
- Permission denied → Check /app/data ownership
- Import error → Verify all dependencies in requirements.txt

### Database errors

**If database file exists but can't be accessed:**

```bash
# Local fix
docker-compose down
rm -rf ./data
docker-compose up -d --build
```

**Verify path:**

```bash
docker exec krypton-backend ls -la /app/data/
```

---

## Commit Reference

**Hash**: `23b7fd5`
**Message**: "Fix container startup: resilient database path, environment variable support, verbose logging"

---

## Next Steps

1. Push to GitHub: `git push origin main`
2. back4app redeploys automatically
3. Monitor back4app logs for successful startup
4. Test API: `curl https://yourapp.back4app.io/api/health`

**Expected result**: Container healthy, API responding, database working

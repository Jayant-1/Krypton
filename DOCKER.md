# 🐳 Docker Setup Guide

This guide explains how to containerize and deploy your Research Assistant AI Agent backend using Docker.

---

## 📋 Files Overview

| File                 | Purpose                               |
| -------------------- | ------------------------------------- |
| `Dockerfile`         | Production container image definition |
| `docker-compose.yml` | Local development and testing setup   |
| `.dockerignore`      | Excludes unnecessary files from build |

---

## 🏗️ Dockerfile Architecture

### Multi-Stage Build Strategy

The Dockerfile uses a **2-stage build** for optimal image size:

```
Stage 1: Builder
├─ Base: python:3.11.5-slim
├─ Install: gcc (build tools)
└─ Output: Python dependencies in /root/.local

Stage 2: Runtime
├─ Base: python:3.11.5-slim (fresh, minimal)
├─ Copy: Dependencies from Stage 1
├─ Copy: Application code (app/)
└─ Result: ~200MB smaller than single-stage
```

**Benefits:**

- ✅ Smaller final image size (~500MB vs ~800MB)
- ✅ Faster deployment
- ✅ No build tools in production (security)
- ✅ Can rebuild quickly

---

## 🚀 Building Locally

### Option 1: Docker Compose (Recommended for Development)

```bash
# Build and start with one command
docker-compose up -d

# See logs
docker-compose logs -f backend

# Stop
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

### Option 2: Docker CLI

```bash
# Build the image
docker build -t krypton-backend:latest .

# Run container
docker run -d \
  --name krypton-backend \
  -p 8080:8080 \
  -e APP_ENV=development \
  -e SECRET_KEY=dev-key-here \
  -e GEMINI_API_KEY=your_key \
  krypton-backend:latest

# View logs
docker logs -f krypton-backend

# Stop container
docker stop krypton-backend
docker rm krypton-backend
```

---

## 🔧 Configuration Options

### Environment Variables in Docker

Set via `docker-compose.yml` or `-e` flags:

```bash
APP_ENV=production                    # development or production
SECRET_KEY=your_secure_key           # 32-byte hex from openssl
GEMINI_API_KEY=...                   # Your API key
SEMANTIC_SCHOLAR_API_KEY=...         # Optional
ALLOWED_ORIGINS=...                  # CORS origins
CACHE_TTL_MINUTES=30                 # Cache timeout
MAX_RESULTS_DEFAULT=20               # Default search limit
```

### Volume Mounts

```bash
# Persist SQLite database
-v ./research_agent.db:/app/research_agent.db

# Development: hot-reload app code
-v ./app:/app/app

# Custom cache directory
-v ./cache:/app/cache
```

---

## ✅ Health Check

The container includes an automatic health check:

```bash
# Test manually
curl http://localhost:8080/api/health

# Docker health status
docker ps
# HEALTHY or UNHEALTHY appears in STATUS column
```

Expected response:

```json
{
  "status": "OK",
  "env": "production",
  "version": "1.0.0"
}
```

---

## 🔐 Security Features

### Non-Root User

- Runs as `appuser` (UID 1000)
- Prevents container escape vulnerabilities
- Required by many security policies

### Minimal Base Image

- Python 3.11.5-slim: ~40MB
- Only includes Python + essential runtime
- No unnecessary tools or libraries

### .dockerignore

- Excludes `.env` files (no secrets in image)
- Excludes `__pycache__` and Python artifacts
- Excludes frontend and documentation
- Reduces build context size

---

## 📦 Container Registry Push (for production)

### To Docker Hub

```bash
# Tag image with your repo
docker tag krypton-backend:latest yourusername/krypton-backend:latest

# Login
docker login

# Push
docker push yourusername/krypton-backend:latest

# Pull and run anywhere
docker run -d \
  -p 8080:8080 \
  -e SECRET_KEY=... \
  yourusername/krypton-backend:latest
```

### To back4app (recommended)

back4app can build directly from your Dockerfile:

1. Push to GitHub with Dockerfile
2. In back4app: **Settings → Docker**
3. Enable "Build from Dockerfile"
4. back4app auto-builds from your GitHub repo

---

## 🚀 Deployment Scenarios

### Scenario 1: Local Development

```bash
docker-compose up -d
# Access at http://localhost:8080
# API docs at http://localhost:8080/docs
```

### Scenario 2: Production on back4app

1. Dockerfile is in project root ✓
2. Push to GitHub
3. back4app auto-builds from Dockerfile
4. Deploys to production

### Scenario 3: Self-Hosted Server

```bash
# Build on server
git clone your-repo
cd your-repo
docker build -t krypton-backend .

# Run with nginx reverse proxy
docker run -d \
  --name backend \
  -p 127.0.0.1:8080:8080 \
  -e APP_ENV=production \
  -e SECRET_KEY=$SECRET_KEY \
  --restart always \
  krypton-backend
```

### Scenario 4: Kubernetes

```bash
# Apply manifests
kubectl apply -f k8s-deployment.yaml

# Or use Helm (if available)
helm install krypton ./helm-chart
```

---

## 🐛 Troubleshooting

### Container won't start

**Logs:**

```bash
docker logs krypton-backend
```

**Common issues:**

- Missing environment variables → `ERROR: SECRET_KEY not set`
- Port already in use → `Address already in use`
- Missing dependencies → `ModuleNotFoundError: No module named 'fastapi'`

**Fix:**

```bash
# Rebuild after code changes
docker-compose up -d --build

# Clean rebuild (ignores cache)
docker-compose down
docker system prune
docker-compose up -d --build
```

### Port conflicts

If port 8080 is already in use:

```yaml
# In docker-compose.yml
ports:
  - "8081:8080" # Map to different host port
```

Or kill the existing process:

```bash
lsof -i :8080
kill -9 <PID>
```

### Slow builds

```bash
# Check .dockerignore - exclude unnecessary files
# Use docker buildkit for faster builds:
DOCKER_BUILDKIT=1 docker build -t krypton-backend .

# On Mac/Windows, enable in Docker Desktop settings
```

### Container exiting immediately

```bash
# Check exit code
docker ps -a

# View detailed logs
docker logs --tail 50 krypton-backend

# Run interactively for debugging
docker run -it krypton-backend /bin/bash
```

---

## 📊 Image Size Optimization

### Current Size

- Multi-stage Dockerfile: ~500MB
- Single-stage (if used): ~800MB

### Optimization Tips

```dockerfile
# ✅ Use slim images
FROM python:3.11.5-slim

# ✅ Clean package manager cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# ✅ Combine RUN commands
RUN apt-get update && apt-get install -y ... && rm -rf /var/lib/apt/lists/*

# ❌ Don't include unnecessary packages
# ❌ Don't leave intermediate layers with junk
```

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push Docker

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t krypton-backend:${{ github.sha }} .

      - name: Push to registry
        run: |
          docker tag krypton-backend:${{ github.sha }} docker.io/user/krypton:latest
          docker push docker.io/user/krypton:latest
```

---

## 📝 Production Checklist

Before deploying to production:

- [ ] Dockerfile tested locally with `docker-compose`
- [ ] `.dockerignore` excludes `.env` and sensitive files
- [ ] Health check passes: `curl http://localhost:8080/api/health`
- [ ] All environment variables set in deployment platform
- [ ] `SECRET_KEY` is production value (from `openssl rand -hex 32`)
- [ ] `ALLOWED_ORIGINS` matches frontend domain
- [ ] Database volume or cloud DB configured
- [ ] Container logs accessible
- [ ] Resource limits set (CPU, memory)
- [ ] Restart policy configured (`always`)

---

## 🎯 Next Steps

1. **Test locally:**

   ```bash
   docker-compose up -d
   curl http://localhost:8080/api/health
   ```

2. **Commit files:**

   ```bash
   git add Dockerfile docker-compose.yml .dockerignore
   git commit -m "Add Docker configuration"
   git push origin main
   ```

3. **Deploy to back4app:**
   - Enable Dockerfile builds in back4app
   - Push to GitHub triggers auto-deploy

4. **Monitor:**
   - Check container logs
   - Monitor health endpoint
   - Set up alerts

---

## 📚 References

- [Docker Documentation](https://docs.docker.com)
- [Docker Compose](https://docs.docker.com/compose/)
- [Best practices for Python Docker images](https://docs.docker.com/language/python/)
- [FastAPI deployment with Docker](https://fastapi.tiangolo.com/deployment/docker/)

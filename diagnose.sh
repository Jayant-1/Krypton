#!/bin/bash
# diagnose.sh - Backend diagnostics script
# Checks all port and CORS configurations

echo "🔍 Backend Diagnostics"
echo "===================="
echo ""

KRYPTON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$KRYPTON_DIR"

# Check 1: Dockerfile port
echo "1️⃣ Dockerfile Port Configuration"
echo "----"
if grep -q 'CMD.*--port.*8080' Dockerfile; then
  echo "✅ Dockerfile CMD uses port 8080"
else
  echo "❌ Dockerfile CMD port incorrect"
  grep "CMD.*port" Dockerfile
fi

if grep -q 'EXPOSE 8080' Dockerfile; then
  echo "✅ Dockerfile EXPOSE 8080"
else
  echo "❌ Dockerfile EXPOSE incorrect"
  grep "EXPOSE" Dockerfile
fi

if grep -q 'CMD curl -f http://localhost:8080' Dockerfile; then
  echo "✅ Dockerfile healthcheck uses port 8080"
else
  echo "❌ Dockerfile healthcheck port incorrect"
fi

echo ""
# Check 2: Procfile port
echo "2️⃣ Procfile Port Configuration"
echo "----"
cat Procfile

if grep -q 'port 8080' Procfile; then
  echo "✅ Procfile port is 8080"
else
  echo "❌ Procfile port incorrect"
fi

echo ""
# Check 3: Frontend VITE configuration
echo "3️⃣ Frontend API Configuration"
echo "----"
echo "Local dev (.env):"
grep "VITE_API_BASE_URL" frontend/.env || echo "❌ frontend/.env not found"

echo ""
echo "Production (.env.production):"
grep "VITE_API_BASE_URL" frontend/.env.production || echo "❌ frontend/.env.production not found"

echo ""
# Check 4: CORS configuration
echo "4️⃣ CORS Configuration"
echo "----"
echo "Backend ALLOWED_ORIGINS:"
grep "ALLOWED_ORIGINS" .env.production || echo "❌ .env.production not found"

echo ""
echo "Backend CORS Middleware (app/main.py):"
if grep -q 'CORSMiddleware' app/main.py; then
  echo "✅ CORS middleware present"
  grep -A 2 "CORSMiddleware" app/main.py | head -3
else
  echo "❌ CORS middleware not configured"
fi

echo ""
# Check 5: Environment variables
echo "5️⃣ Environment Setup"
echo "----"
echo "Python version:"
python3 --version

echo ""
echo "pip packages installed:"
pip3 list | grep -E "fastapi|uvicorn|cors" || echo "⚠️  Critical packages may be missing"

echo ""
# Check 6: Git status
echo "6️⃣ Git Status"
echo "----"
echo "Last 3 commits:"
git log --oneline | head -3

echo ""
echo "Working tree:"
if git status --porcelain | grep -q .; then
  echo "⚠️  Uncommitted changes detected:"
  git status --short
else
  echo "✅ Working tree clean"
fi

echo ""
# Check 7: Backend health
echo "7️⃣ Backend Health Check"
echo "----"
echo "Attempting to reach: https://krypton-ryngvlpb.b4a.run/api/health"

if command -v curl &> /dev/null; then
  RESPONSE=$(curl -s -w "\n%{http_code}" https://krypton-ryngvlpb.b4a.run/api/health 2>&1 | tail -1)
  if [ "$RESPONSE" = "200" ]; then
    echo "✅ Backend responding (HTTP 200)"
  else
    echo "⚠️  Backend status: HTTP $RESPONSE"
  fi
else
  echo "⚠️  curl not available for health check"
fi

echo ""
echo "===================="
echo "✅ Diagnostics complete"
echo ""
echo "📋 Next Steps:"
echo "1. Verify all port configurations show 8080 ✓"
echo "2. Check CORS ALLOWED_ORIGINS matches your Vercel URL"
echo "3. If CORS still blocked, run: ./cors-fix.sh https://your-vercel-url.vercel.app"
echo "4. Commit changes: git add .env.production && git commit -m 'Fix CORS'"
echo "5. Update back4app environment variables"
echo "6. Restart backend"

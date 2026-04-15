# 🔧 Backend Configuration for back4app

## Deployment Settings

| Setting | Value |
|---------|-------|
| **Platform** | back4app |
| **Branch** | main |
| **Root Directory** | ./ |
| **Port** | 8080 |
| **Runtime** | Python 3.11.5 |
| **Server** | FastAPI (uvicorn) |

---

## Procfile Configuration

```
web: uvicorn app.main:app --host 0.0.0.0 --port 8080
```

### What This Means
- **web**: Process type (required by back4app)
- **uvicorn**: ASGI server for FastAPI
- **app.main:app**: Python module and FastAPI instance
- **0.0.0.0**: Listen on all interfaces (required for cloud hosting)
- **8080**: Port number (fixed, not dynamic)

---

## Environment Variables Required

Set these in back4app Dashboard → Settings → Environment Variables:

```bash
# Critical Security
SECRET_KEY=3bf13a49f95767c884734a935c87eb7e6ad8775d569059d55200b63f20e8f26d

# App Config
APP_ENV=production
APP_VERSION=1.0.0

# API Keys (your actual keys)
GEMINI_API_KEY=your_gemini_api_key_here
SEMANTIC_SCHOLAR_API_KEY=

# CORS - Set to your Vercel frontend URL
ALLOWED_ORIGINS=https://yourapp.vercel.app

# Cache
CACHE_TTL_MINUTES=30

# Search Settings
MAX_RESULTS_DEFAULT=20
MAX_RESULTS_LIMIT=50

# AI Model
GEMINI_MODEL=gemini-2.5-flash
```

---

## Deployment Checklist

- [ ] Procfile in project root
- [ ] runtime.txt specifies Python 3.11.5
- [ ] requirements.txt has all dependencies
- [ ] .gitignore configured
- [ ] GitHub repository created
- [ ] back4app account + app created
- [ ] GitHub connected to back4app (Settings → Git)
- [ ] Auto-deploy enabled on push
- [ ] Environment variables set in back4app
- [ ] Backend URL noted: `https://yourapp.back4app.io`

---

## API Health Check

After deployment, verify backend is running:

```bash
curl https://yourapp.back4app.io/api/health
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

## Port 8080 Details

- **Why 8080?** Fixed port ensures stable connection string for frontend
- **Dynamic vs Fixed**: Uses fixed port instead of `$PORT` for consistent configuration
- **Frontend URL**: Must match exactly at deployment time
- **CORS**: Vercel frontend must whitelist this domain

---

## Next Steps

1. Ensure Procfile is committed: `git add Procfile && git commit -m "Confirm port 8080 config"`
2. Push to GitHub: `git push origin main`
3. back4app auto-deploys from GitHub push
4. Check back4app Logs for startup messages
5. Test health endpoint
6. Verify frontend CORS configuration matches

---

## Troubleshooting

**Backend won't start:**
- Check back4app Logs for Python errors
- Verify all imports in `app/` are correct
- Check requirements.txt has all dependencies

**Can't reach backend from Vercel:**
- Verify domain: `https://yourapp.back4app.io`
- Check CORS: `ALLOWED_ORIGINS` must include Vercel URL
- Check frontend: `VITE_API_BASE_URL` must match exactly

**Port 8080 not working:**
- Don't override in environment
- Use fixed port in Procfile (not `$PORT`)
- Ensure back4app recognizes the Procfile

---

## Reference

- [back4app Procfile docs](https://www.back4app.com/docs)
- [FastAPI deployment](https://fastapi.tiangolo.com/deployment/)
- [Uvicorn server options](https://www.uvicorn.org/)

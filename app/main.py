"""
app/main.py — FastAPI application entry point
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.database import init_db
from app.routers import health, history, papers, search, gaps, topics, auth, user
from app.services.cache_service import get_cache

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    cfg = get_settings()
    get_cache()
    await init_db()   # creates SQLite tables if not exist
    logger.info("=" * 60)
    logger.info("🚀  Research Assistant AI Agent — Backend")
    logger.info("    Version  : %s", cfg.app_version)
    logger.info("    Env      : %s", cfg.app_env)
    logger.info("    DB       : %s", os.getenv("DATABASE_PATH", "./research_agent.db"))
    logger.info("    Cache    : in-memory TTL only (disk cache removed)")
    logger.info("    Gemini   : %s", "✅ configured" if cfg.gemini_api_key else "❌ NOT configured")
    logger.info("    S2 Key   : %s", "✅ configured" if cfg.semantic_scholar_api_key else "⚪ using OpenAlex (free)")
    logger.info("    Docs     : http://127.0.0.1:8000/docs")
    logger.info("=" * 60)
    yield
    logger.info("Server shutting down.")



cfg = get_settings()

app = FastAPI(
    title="Research Assistant AI Agent",
    description=(
        "## 🔬 Research Assistant AI Agent API\n\n"
        "Searches, ranks, summarises, and extracts insights from academic papers.\n\n"
        "### Sources\n"
        "- **arXiv** — preprints (CS, Physics, Math)\n"
        "- **OpenAlex** — cross-domain with citation counts (free, no key)\n\n"
        "### AI Features (Google Gemini)\n"
        "- **Summary** — 3-5 sentence plain-English explanation\n"
        "- **Insights** — structured {problem, method, result, limitation}\n\n"
        "### Persistence\n"
        "- SQLite database (`research_agent.db`) for search history and AI results\n"
        "- In-memory + disk cache for fast repeated access"
    ),
    version=cfg.app_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {"name": "Search", "description": "Search and rank academic papers"},
        {"name": "Papers", "description": "AI summaries and structured insights"},
        {"name": "History", "description": "Browse past searches from the database"},
        {"name": "Cache", "description": "Clear cached results (use when AI returned an error)"},
        {"name": "Health", "description": "Server health and configuration status"},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cfg.allowed_origins.split(",") if cfg.allowed_origins else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router,   prefix="/api")
app.include_router(search.router,   prefix="/api")
app.include_router(papers.router,   prefix="/api")
app.include_router(history.router,  prefix="/api")
app.include_router(gaps.router,     prefix="/api")
app.include_router(topics.router,   prefix="/api")
app.include_router(auth.router,     prefix="/api")
app.include_router(user.router,     prefix="/api")


@app.get("/", include_in_schema=False)
async def root():
    return JSONResponse({
        "message": "Research Assistant AI Agent API",
        "docs": "/docs",
        "health": "/api/health",
        "history": "/api/history",
    })

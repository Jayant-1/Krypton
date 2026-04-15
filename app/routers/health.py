"""
app/routers/health.py — /api/health
"""
from fastapi import APIRouter
from app.config import get_settings
from app.models.schemas import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, summary="Health Check")
async def health_check():
    """Returns server status and configuration flags."""
    cfg = get_settings()
    return HealthResponse(
        status="ok",
        version=cfg.app_version,
        environment=cfg.app_env,
        gemini_configured=bool(cfg.gemini_api_key),
        semantic_scholar_configured=bool(cfg.semantic_scholar_api_key),
    )

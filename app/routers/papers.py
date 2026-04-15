"""
app/routers/papers.py

GET /api/papers/{paper_id}/summary
GET /api/papers/{paper_id}/insights

DB layer: summaries and insights are stored in SQLite.
Cache layer: in-memory + disk cache for fast repeated access.
Error responses are NEVER cached or stored in DB.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.schemas import InsightResponse, SummaryResponse
from app.services.ai_service import generate_insights, generate_summary
from app.services.cache_service import get_cache
from app.services.db_service import (
    get_insights_from_db,
    get_summary_from_db,
    save_insights,
    save_summary,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Papers"])

_ERROR_SENTINELS = (
    "Gemini API error",
    "GEMINI_API_KEY",
    "Unavailable",
    "unavailable",
    "Could not parse",
)


def _is_error_response(data: dict) -> bool:
    for v in data.values():
        if isinstance(v, str) and any(s in v for s in _ERROR_SENTINELS):
            return True
    return False


# ── Summary ───────────────────────────────────────────────────────────────────

@router.get(
    "/papers/{paper_id}/summary",
    response_model=SummaryResponse,
    summary="Get AI Summary",
    description="3-5 sentence plain-English summary. Checks cache → DB → Gemini.",
)
async def get_paper_summary(
    paper_id: str,
    title: str = Query(..., min_length=1),
    abstract: str = Query(..., min_length=10),
    db: AsyncSession = Depends(get_db),
) -> SummaryResponse:
    cache = get_cache()
    cache_key = cache.make_paper_key(paper_id, "summary")

    # Layer 1: memory/disk cache
    cached = cache.get(cache_key)
    if cached:
        logger.info("Cache hit: summary for '%s'", paper_id)
        cached["cached"] = True
        return SummaryResponse(**cached)

    # Layer 2: database
    db_record = await get_summary_from_db(db, paper_id)
    if db_record:
        logger.info("DB hit: summary for '%s'", paper_id)
        result = SummaryResponse(
            paper_id=db_record.paper_id,
            title=db_record.title,
            summary=db_record.summary,
            key_contribution=db_record.key_contribution,
            cached=True,
        )
        cache.set(cache_key, result.model_dump(exclude={"cached"}))
        return result

    # Layer 3: call Gemini
    try:
        result = await generate_summary(paper_id=paper_id, title=title, abstract=abstract)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.error("Summary generation failed: %s", exc)
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable.")

    payload = result.model_dump(exclude={"cached"})
    if not _is_error_response(payload):
        cache.set(cache_key, payload)
        try:
            await save_summary(db, result)
        except Exception as exc:
            logger.error("Failed to save summary to DB: %s", exc)
    else:
        logger.warning("Summary for '%s' contained errors — NOT saving", paper_id)

    return result


# ── Insights ──────────────────────────────────────────────────────────────────

@router.get(
    "/papers/{paper_id}/insights",
    response_model=InsightResponse,
    summary="Get Structured Insights",
    description="problem/method/result/limitation. Checks cache → DB → Gemini.",
)
async def get_paper_insights(
    paper_id: str,
    title: str = Query(..., min_length=1),
    abstract: str = Query(..., min_length=10),
    db: AsyncSession = Depends(get_db),
) -> InsightResponse:
    cache = get_cache()
    cache_key = cache.make_paper_key(paper_id, "insights")

    # Layer 1: memory/disk cache
    cached = cache.get(cache_key)
    if cached:
        logger.info("Cache hit: insights for '%s'", paper_id)
        cached["cached"] = True
        return InsightResponse(**cached)

    # Layer 2: database
    db_record = await get_insights_from_db(db, paper_id)
    if db_record:
        logger.info("DB hit: insights for '%s'", paper_id)
        result = InsightResponse(
            paper_id=db_record.paper_id,
            title=db_record.title,
            problem=db_record.problem,
            method=db_record.method,
            result=db_record.result,
            limitation=db_record.limitation,
            cached=True,
        )
        cache.set(cache_key, result.model_dump(exclude={"cached"}))
        return result

    # Layer 3: call Gemini
    try:
        result = await generate_insights(paper_id=paper_id, title=title, abstract=abstract)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.error("Insight extraction failed: %s", exc)
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable.")

    payload = result.model_dump(exclude={"cached"})
    if not _is_error_response(payload):
        cache.set(cache_key, payload)
        try:
            await save_insights(db, result)
        except Exception as exc:
            logger.error("Failed to save insights to DB: %s", exc)
    else:
        logger.warning("Insights for '%s' contained errors — NOT saving", paper_id)

    return result

"""
app/routers/gaps.py

POST /api/gaps/analyze
  — Accepts a search_id + list of papers from the search result
  — Calls Gemini to detect research gaps
  — Saves result to SQLite (research_gaps table)
  — Returns structured gap analysis
"""
from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.db_models import ResearchGapRecord
from app.services.gap_service import analyze_research_gaps
from app.services.cache_service import get_cache

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Research Gaps"])


# ── Request / Response schemas ─────────────────────────────────────────────────

class PaperInput(BaseModel):
    id: str
    title: str
    abstract: str


class GapAnalysisRequest(BaseModel):
    search_id: int
    query: str
    papers: list[PaperInput]


class GapItem(BaseModel):
    title: str
    description: str
    confidence: int
    paper_count: int


class GapCluster(BaseModel):
    theme: str
    gaps: list[str]


class GapAnalysisResponse(BaseModel):
    search_id: int
    query: str
    paper_count: int
    top_gaps: list[GapItem]
    open_questions: list[str]
    clusters: list[GapCluster]
    cached: bool


# ── Endpoint ───────────────────────────────────────────────────────────────────

@router.post("/gaps/analyze", response_model=GapAnalysisResponse)
async def analyze_gaps(
    request: GapAnalysisRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Analyze research gaps across a set of papers from a search session.

    Cache strategy:
      - L1: In-memory TTL cache keyed by normalized query
      - L2: SQLite DB keyed by normalized query
      - L3: Gemini API call
    """
    if not request.papers:
        raise HTTPException(status_code=422, detail="At least one paper is required.")

    normalized_query = request.query.strip().lower()
    cache = get_cache()
    cache_key = f"gap:{normalized_query}"

    # ── L1: In-memory cache ──────────────────────────────────────────────────
    mem_cached = cache.get(cache_key)
    if mem_cached:
        logger.info("Gap analysis memory cache hit for '%s'", normalized_query)
        return GapAnalysisResponse(**{**mem_cached, "cached": True})

    # ── L2: SQLite DB ──────────────────────────────────────────────────────
    existing = await db.scalar(
        select(ResearchGapRecord)
        .where(ResearchGapRecord.query == normalized_query)
        .order_by(ResearchGapRecord.created_at.desc())
    )
    if existing:
        logger.info("Gap analysis DB hit for '%s'", normalized_query)
        result_dict = {
            "search_id":      existing.search_id,
            "query":          existing.query,
            "paper_count":    existing.paper_count,
            "top_gaps":       existing.top_gaps_list(),
            "open_questions": existing.open_questions_list(),
            "clusters":       existing.clusters_list(),
        }
        cache.set(cache_key, result_dict)  # warm L1
        return GapAnalysisResponse(**{**result_dict, "cached": True})

    # ── L3: Gemini API ──────────────────────────────────────────────────────
    papers_dicts = [{"title": p.title, "abstract": p.abstract} for p in request.papers]
    logger.info("Running gap analysis for '%s' with %d papers", normalized_query, len(papers_dicts))

    result = await analyze_research_gaps(query=request.query, papers=papers_dicts)

    if not result.get("top_gaps"):
        raise HTTPException(status_code=503, detail="Gap analysis failed — Gemini API error.")

    # ── Save to DB ────────────────────────────────────────────────────────────
    record = ResearchGapRecord(
        search_id=request.search_id,
        query=normalized_query,
        paper_count=len(request.papers),
        top_gaps=json.dumps(result["top_gaps"]),
        open_questions=json.dumps(result["open_questions"]),
        clusters=json.dumps(result["clusters"]),
    )
    db.add(record)
    try:
        await db.commit()
        await db.refresh(record)
    except Exception:
        await db.rollback()
        logger.warning("Could not save gap analysis to DB (duplicate or error)")

    result_dict = {
        "search_id":      request.search_id,
        "query":          normalized_query,
        "paper_count":    len(request.papers),
        "top_gaps":       result["top_gaps"],
        "open_questions": result["open_questions"],
        "clusters":       result["clusters"],
    }
    cache.set(cache_key, result_dict)  # warm L1 cache

    return GapAnalysisResponse(**{**result_dict, "cached": False})

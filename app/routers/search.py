"""
app/routers/search.py — POST /api/search

Full pipeline:
  1. Check in-memory cache  (hot requests in same server session)
  2. Check SQLite DB        (persistent — replaces old disk cache)
  3. Fetch arXiv + OpenAlex in parallel
  4. Enrich arXiv papers with citation counts via OpenAlex
  5. Rank papers
  6. Save to SQLite DB (search history + papers)
  7. Cache in memory + return
"""
from __future__ import annotations

import asyncio
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.schemas import Paper, PaperSource, SearchRequest, SearchResponse
from app.services.arxiv_service import fetch_arxiv_papers
from app.services.cache_service import get_cache
from app.services.db_service import get_cached_search, save_search
from app.services.openalex_service import enrich_with_citations, fetch_openalex_papers
from app.services.ranking_service import rank_papers

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Search"])


@router.post(
    "/search",
    response_model=SearchResponse,
    summary="Search Research Papers",
    description=(
        "Fetches papers from arXiv and OpenAlex, enriches arXiv results with "
        "real citation counts, ranks by relevance + recency + citations, "
        "saves to database, and returns a sorted list. "
        "Repeated identical queries are served from the in-memory cache or "
        "the SQLite database without hitting external APIs again."
    ),
)
async def search_papers(
    request: SearchRequest,
    db: AsyncSession = Depends(get_db),
) -> SearchResponse:
    cache = get_cache()
    cache_key = cache.make_search_key(
        request.query,
        request.year_from,
        request.year_to,
        request.domain.value,
        request.max_results,
        request.sources.value,
    )

    # ── Layer 1: in-memory cache ──────────────────────────────────────────────
    cached = cache.get(cache_key)
    if cached:
        logger.info("Memory cache hit for '%s'", cache_key)
        cached["cached"] = True
        return SearchResponse(**cached)

    # ── Layer 2: SQLite DB (persistent, replaces disk cache) ──────────────────
    db_result = await get_cached_search(db, request)
    if db_result:
        search_record, papers = db_result
        sources_used = (
            search_record.sources_used.split(",")
            if search_record.sources_used
            else []
        )
        response = SearchResponse(
            query=request.query,
            total=len(papers),
            papers=papers,
            cached=True,
            sources_used=sources_used,
            search_id=search_record.id,
        )
        # Warm memory cache from DB
        cache.set(cache_key, response.model_dump(exclude={"cached"}))
        return response

    # ── Layer 3: parallel fetch from external APIs ────────────────────────────
    use_arxiv = request.sources in (PaperSource.ARXIV, PaperSource.BOTH)
    use_openalex = request.sources in (PaperSource.SEMANTIC_SCHOLAR, PaperSource.BOTH)

    tasks = []
    if use_arxiv:
        tasks.append(fetch_arxiv_papers(
            query=request.query, domain=request.domain,
            year_from=request.year_from, year_to=request.year_to,
            max_results=request.max_results,
        ))
    if use_openalex:
        tasks.append(fetch_openalex_papers(
            query=request.query, domain=request.domain,
            year_from=request.year_from, year_to=request.year_to,
            max_results=request.max_results,
        ))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    arxiv_papers: List[Paper] = []
    oa_papers: List[Paper] = []
    sources_used: List[str] = []

    idx = 0
    if use_arxiv:
        r = results[idx]
        if isinstance(r, Exception):
            logger.warning("arXiv fetch failed: %s", r)
        else:
            arxiv_papers = r
            sources_used.append("arxiv")
        idx += 1

    if use_openalex:
        r = results[idx]
        if isinstance(r, Exception):
            logger.warning("OpenAlex fetch failed: %s", r)
        else:
            oa_papers = r
            sources_used.append("openalex")

    if not arxiv_papers and not oa_papers:
        raise HTTPException(
            status_code=404,
            detail="No papers found for the given query and filters. Try broader terms.",
        )

    # ── Citation enrichment for arXiv papers ─────────────────────────────────
    if arxiv_papers:
        arxiv_papers = await enrich_with_citations(arxiv_papers)

    # ── Merge, rank, cap ─────────────────────────────────────────────────────
    all_papers = arxiv_papers + oa_papers
    ranked = rank_papers(
        request.query,
        all_papers,
        user_interests=request.user_interests or None,
        prefer_recent=request.prefer_recent,
    )
    ranked = ranked[: request.max_results]

    # ── Save to DB ────────────────────────────────────────────────────────────
    search_id = 0
    try:
        saved = await save_search(db, request, ranked, sources_used)
        search_id = saved.id
    except Exception as exc:
        logger.error("Failed to save search to DB: %s", exc)
        # Non-fatal — continue to return results even if DB write fails

    # ── Warm memory cache + return ────────────────────────────────────────────
    response = SearchResponse(
        query=request.query,
        total=len(ranked),
        papers=ranked,
        cached=False,
        sources_used=sources_used,
        search_id=search_id,
    )
    cache.set(cache_key, response.model_dump(exclude={"cached"}))
    return response

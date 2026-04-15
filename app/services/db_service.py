"""
app/services/db_service.py

Database CRUD helpers used by routers.
All functions are async and accept an AsyncSession.
"""
from __future__ import annotations

import json
import logging
from typing import List, Optional, Tuple

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db_models import InsightRecord, PaperRecord, SearchRecord, SummaryRecord
from app.models.schemas import InsightResponse, Paper, PaperSource, SearchRequest, SummaryResponse

logger = logging.getLogger(__name__)


# ── Search ────────────────────────────────────────────────────────────────────

async def save_search(
    db: AsyncSession,
    request: SearchRequest,
    papers: List[Paper],
    sources_used: List[str],
) -> SearchRecord:
    """Persist a search query and its ranked paper results."""
    search = SearchRecord(
        query=request.query,
        year_from=request.year_from,
        year_to=request.year_to,
        domain=request.domain.value,
        max_results=request.max_results,
        sources=request.sources.value,
        result_count=len(papers),
        sources_used=",".join(sources_used),
    )
    db.add(search)
    await db.flush()  # get search.id before adding children

    for rank, paper in enumerate(papers, start=1):
        record = PaperRecord(
            search_id=search.id,
            paper_id=paper.id,
            title=paper.title,
            abstract=paper.abstract,
            authors=json.dumps(paper.authors),
            year=paper.year,
            link=paper.link,
            source=paper.source.value,
            doi=paper.doi,
            citation_count=paper.citation_count,
            relevance_score=paper.relevance_score,
            recency_score=paper.recency_score,
            citation_score=paper.citation_score,
            combined_score=paper.combined_score,
            rank_position=rank,
        )
        db.add(record)

    await db.commit()
    await db.refresh(search)
    logger.info("Saved search #%d: '%s' → %d papers", search.id, request.query, len(papers))
    return search


async def get_search_history(
    db: AsyncSession,
    limit: int = 20,
    offset: int = 0,
) -> List[SearchRecord]:
    """Return recent searches, newest first."""
    result = await db.execute(
        select(SearchRecord)
        .order_by(desc(SearchRecord.created_at))
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())


async def get_search_by_id(db: AsyncSession, search_id: int) -> Optional[SearchRecord]:
    result = await db.execute(
        select(SearchRecord).where(SearchRecord.id == search_id)
    )
    return result.scalar_one_or_none()


async def get_cached_search(
    db: AsyncSession,
    request: SearchRequest,
) -> Optional[Tuple[SearchRecord, List[Paper]]]:
    """
    Look up the most-recent identical search in the DB.
    Returns (SearchRecord, List[Paper]) if found, else None.
    Used by the search router as a DB-backed persistence layer
    replacing the old disk cache.
    """
    stmt = (
        select(SearchRecord)
        .where(
            SearchRecord.query == request.query,
            SearchRecord.year_from == request.year_from,
            SearchRecord.year_to == request.year_to,
            SearchRecord.domain == request.domain.value,
            SearchRecord.max_results == request.max_results,
            SearchRecord.sources == request.sources.value,
        )
        .order_by(desc(SearchRecord.created_at))
        .limit(1)
    )
    search = (await db.execute(stmt)).scalar_one_or_none()
    if not search:
        return None

    papers_result = await db.execute(
        select(PaperRecord)
        .where(PaperRecord.search_id == search.id)
        .order_by(PaperRecord.rank_position)
    )
    paper_records = list(papers_result.scalars().all())

    papers: List[Paper] = [
        Paper(
            id=p.paper_id,
            title=p.title,
            abstract=p.abstract,
            authors=p.authors_list(),
            year=p.year,
            link=p.link,
            source=PaperSource(p.source),
            doi=p.doi,
            citation_count=p.citation_count,
            relevance_score=p.relevance_score,
            recency_score=p.recency_score,
            citation_score=p.citation_score,
            combined_score=p.combined_score,
        )
        for p in paper_records
    ]
    logger.info(
        "DB hit: search #%d '%s' → %d papers", search.id, request.query, len(papers)
    )
    return search, papers


# ── Summary ───────────────────────────────────────────────────────────────────

async def save_summary(db: AsyncSession, result: SummaryResponse) -> SummaryRecord:
    """Upsert a summary record (insert or update if paper_id exists)."""
    existing = await db.execute(
        select(SummaryRecord).where(SummaryRecord.paper_id == result.paper_id)
    )
    record = existing.scalar_one_or_none()

    if record:
        record.summary = result.summary
        record.key_contribution = result.key_contribution
    else:
        record = SummaryRecord(
            paper_id=result.paper_id,
            title=result.title,
            summary=result.summary,
            key_contribution=result.key_contribution,
        )
        db.add(record)

    await db.commit()
    await db.refresh(record)
    logger.info("Saved summary for paper '%s'", result.paper_id)
    return record


async def get_summary_from_db(
    db: AsyncSession, paper_id: str
) -> Optional[SummaryRecord]:
    result = await db.execute(
        select(SummaryRecord).where(SummaryRecord.paper_id == paper_id)
    )
    return result.scalar_one_or_none()


# ── Insights ──────────────────────────────────────────────────────────────────

async def save_insights(db: AsyncSession, result: InsightResponse) -> InsightRecord:
    """Upsert an insight record."""
    existing = await db.execute(
        select(InsightRecord).where(InsightRecord.paper_id == result.paper_id)
    )
    record = existing.scalar_one_or_none()

    if record:
        record.problem = result.problem
        record.method = result.method
        record.result = result.result
        record.limitation = result.limitation
    else:
        record = InsightRecord(
            paper_id=result.paper_id,
            title=result.title,
            problem=result.problem,
            method=result.method,
            result=result.result,
            limitation=result.limitation,
        )
        db.add(record)

    await db.commit()
    await db.refresh(record)
    logger.info("Saved insights for paper '%s'", result.paper_id)
    return record


async def get_insights_from_db(
    db: AsyncSession, paper_id: str
) -> Optional[InsightRecord]:
    result = await db.execute(
        select(InsightRecord).where(InsightRecord.paper_id == paper_id)
    )
    return result.scalar_one_or_none()


async def delete_summary_from_db(db: AsyncSession, paper_id: str) -> bool:
    """Delete a summary record from DB. Returns True if deleted."""
    record = await get_summary_from_db(db, paper_id)
    if record:
        await db.delete(record)
        await db.commit()
        logger.info("Deleted summary for paper '%s' from DB", paper_id)
        return True
    return False


async def delete_insights_from_db(db: AsyncSession, paper_id: str) -> bool:
    """Delete an insight record from DB. Returns True if deleted."""
    record = await get_insights_from_db(db, paper_id)
    if record:
        await db.delete(record)
        await db.commit()
        logger.info("Deleted insights for paper '%s' from DB", paper_id)
        return True
    return False

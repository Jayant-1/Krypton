"""
app/routers/history.py

GET  /api/history              — list recent searches
GET  /api/history/{id}         — get a specific search + its papers
GET  /api/history/{id}/papers  — papers for a specific search (paginated)
"""
from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.db_models import SearchRecord
from app.services.db_service import get_search_by_id, get_search_history
from pydantic import BaseModel
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(tags=["History"])


# ── Response schemas ──────────────────────────────────────────────────────────

class SearchHistoryItem(BaseModel):
    id: int
    query: str
    year_from: Optional[int]
    year_to: Optional[int]
    domain: str
    sources: str
    result_count: int
    sources_used: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PaperHistoryItem(BaseModel):
    paper_id: str
    title: str
    authors: str         # raw JSON string
    year: Optional[int]
    link: str
    source: str
    citation_count: int
    combined_score: float
    rank_position: int

    model_config = {"from_attributes": True}


class SearchDetailResponse(BaseModel):
    search: SearchHistoryItem
    papers: List[PaperHistoryItem]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get(
    "/history",
    response_model=List[SearchHistoryItem],
    summary="Search History",
    description="Returns the most recent search queries, newest first.",
)
async def list_history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> List[SearchHistoryItem]:
    records = await get_search_history(db, limit=limit, offset=offset)
    return [SearchHistoryItem.model_validate(r) for r in records]


@router.get(
    "/history/{search_id}",
    response_model=SearchDetailResponse,
    summary="Search Detail with Papers",
    description="Returns a specific search record along with all its ranked papers.",
)
async def get_history_detail(
    search_id: int,
    db: AsyncSession = Depends(get_db),
) -> SearchDetailResponse:
    record = await get_search_by_id(db, search_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Search #{search_id} not found.")

    papers = [PaperHistoryItem.model_validate(p) for p in record.papers]
    return SearchDetailResponse(
        search=SearchHistoryItem.model_validate(record),
        papers=papers,
    )

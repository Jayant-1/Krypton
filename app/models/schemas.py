"""
app/models/schemas.py — All Pydantic request/response models
"""
from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl


# ── Enums ─────────────────────────────────────────────────────────────────────

class PaperSource(str, Enum):
    ARXIV = "arxiv"
    SEMANTIC_SCHOLAR = "semantic_scholar"
    BOTH = "both"


class Domain(str, Enum):
    ALL = "all"
    AI = "AI"
    ML = "ML"
    NLP = "NLP"
    CV = "CV"
    HEALTHCARE = "Healthcare"
    ROBOTICS = "Robotics"
    DATA_SCIENCE = "Data Science"
    SECURITY = "Security"


# ── Request Models ────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=300, examples=["transformer attention mechanism"])
    year_from: Optional[int] = Field(None, ge=1990, le=2026, examples=[2020])
    year_to: Optional[int] = Field(None, ge=1990, le=2026, examples=[2024])
    domain: Domain = Field(Domain.ALL, examples=["AI"])
    max_results: int = Field(20, ge=1, le=50, examples=[20])
    sources: PaperSource = Field(PaperSource.BOTH, examples=["both"])
    # ── Personalization (optional) ─────────────────────────────────────
    user_interests: List[str] = Field(default_factory=list, examples=[["NLP", "transformers"]])
    skill_level: str = Field("all", examples=["beginner"])   # beginner | intermediate | advanced | all
    prefer_recent: bool = Field(False)                        # boost recency weight
    goal: str = Field("research", examples=["startup"])       # research | learning | startup

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "query": "transformer attention mechanism",
                    "year_from": 2020,
                    "year_to": 2024,
                    "domain": "AI",
                    "max_results": 20,
                    "sources": "both",
                    "user_interests": ["NLP"],
                    "skill_level": "intermediate",
                    "prefer_recent": False,
                    "goal": "research",
                }
            ]
        }
    }


# ── Core Paper Model ──────────────────────────────────────────────────────────

class Paper(BaseModel):
    id: str = Field(..., description="Unique paper identifier (arxiv ID or S2 ID)")
    title: str
    abstract: str
    authors: List[str]
    year: Optional[int] = None
    link: str
    source: PaperSource
    doi: Optional[str] = None
    citation_count: int = 0

    # Ranking scores (0.0 – 1.0)
    relevance_score: float = 0.0
    recency_score: float = 0.0
    citation_score: float = 0.0
    combined_score: float = 0.0


# ── Response Models ───────────────────────────────────────────────────────────

class SearchResponse(BaseModel):
    query: str
    total: int
    papers: List[Paper]
    cached: bool = False
    sources_used: List[str] = []
    search_id: int = 0   # SQLite row ID — used by gap analysis endpoint


class SummaryResponse(BaseModel):
    paper_id: str
    title: str
    summary: str = Field(..., description="3-5 line plain-English summary of the paper")
    key_contribution: str = Field(..., description="Single sentence describing the main contribution")
    cached: bool = False


class InsightResponse(BaseModel):
    paper_id: str
    title: str
    problem: str = Field(..., description="The problem the paper addresses")
    method: str = Field(..., description="Approach or methodology used")
    result: str = Field(..., description="Key findings or results")
    limitation: str = Field(..., description="Stated or inferred limitations")
    cached: bool = False


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    gemini_configured: bool
    semantic_scholar_configured: bool


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None


# ── Topic Discovery ─────────────────────────────────────────────────────

class TopicSuggestRequest(BaseModel):
    interests: List[str] = Field(default_factory=list)
    skill_level: str = "all"   # beginner | intermediate | advanced | all
    goal: str = "research"     # research | learning | startup


class TopicItem(BaseModel):
    name: str
    description: str             # 1-2 sentences
    difficulty: str              # Beginner | Intermediate | Advanced
    hot_score: int               # 1-10
    suggested_query: str         # Ready-to-search query string


class TopicSuggestResponse(BaseModel):
    topics: List[TopicItem]
    profile_summary: str         # e.g. "For an intermediate researcher interested in NLP"

"""
app/models/db_models.py

SQLAlchemy ORM models (tables).

Tables:
  - searches       : every search query + filters + timestamp
  - papers         : every paper fetched (with ranking scores)
  - summaries      : AI-generated summaries per paper
  - insights       : AI-extracted structured insights per paper
  - research_gaps  : AI-detected research gaps per search session
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ── searches ──────────────────────────────────────────────────────────────────

class SearchRecord(Base):
    __tablename__ = "searches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    query: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    year_from: Mapped[int | None] = mapped_column(Integer, nullable=True)
    year_to: Mapped[int | None] = mapped_column(Integer, nullable=True)
    domain: Mapped[str] = mapped_column(String(50), default="all")
    max_results: Mapped[int] = mapped_column(Integer, default=20)
    sources: Mapped[str] = mapped_column(String(30), default="both")
    result_count: Mapped[int] = mapped_column(Integer, default=0)
    sources_used: Mapped[str] = mapped_column(String(100), default="")  # comma-sep
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    # Relationship: one search → many papers
    papers: Mapped[list["PaperRecord"]] = relationship(
        "PaperRecord", back_populates="search", cascade="all, delete-orphan"
    )


# ── papers ────────────────────────────────────────────────────────────────────

class PaperRecord(Base):
    __tablename__ = "papers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    search_id: Mapped[int] = mapped_column(ForeignKey("searches.id"), nullable=False, index=True)

    paper_id: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    abstract: Mapped[str] = mapped_column(Text, nullable=False)
    authors: Mapped[str] = mapped_column(Text, default="[]")   # JSON array string
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    link: Mapped[str] = mapped_column(String(500), default="")
    source: Mapped[str] = mapped_column(String(50), default="")
    doi: Mapped[str | None] = mapped_column(String(200), nullable=True)
    citation_count: Mapped[int] = mapped_column(Integer, default=0)

    # Ranking scores
    relevance_score: Mapped[float] = mapped_column(Float, default=0.0)
    recency_score: Mapped[float] = mapped_column(Float, default=0.0)
    citation_score: Mapped[float] = mapped_column(Float, default=0.0)
    combined_score: Mapped[float] = mapped_column(Float, default=0.0)

    rank_position: Mapped[int] = mapped_column(Integer, default=0)  # 1-based
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    search: Mapped["SearchRecord"] = relationship("SearchRecord", back_populates="papers")

    def authors_list(self) -> list[str]:
        try:
            return json.loads(self.authors)
        except Exception:
            return []


# ── summaries ─────────────────────────────────────────────────────────────────

class SummaryRecord(Base):
    __tablename__ = "summaries"
    __table_args__ = (UniqueConstraint("paper_id", name="uq_summary_paper_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    paper_id: Mapped[str] = mapped_column(String(200), nullable=False, unique=True, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    key_contribution: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


# ── insights ──────────────────────────────────────────────────────────────────

class InsightRecord(Base):
    __tablename__ = "insights"
    __table_args__ = (UniqueConstraint("paper_id", name="uq_insight_paper_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    paper_id: Mapped[str] = mapped_column(String(200), nullable=False, unique=True, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    problem: Mapped[str] = mapped_column(Text, nullable=False)
    method: Mapped[str] = mapped_column(Text, nullable=False)
    result: Mapped[str] = mapped_column(Text, nullable=False)
    limitation: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


# ── research_gaps ─────────────────────────────────────────────────────────────

class ResearchGapRecord(Base):
    __tablename__ = "research_gaps"
    __table_args__ = (UniqueConstraint("query", name="uq_gap_query"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    search_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    query: Mapped[str] = mapped_column(String(300), nullable=False, unique=True, index=True)
    paper_count: Mapped[int] = mapped_column(Integer, default=0)
    # JSON arrays stored as Text
    top_gaps: Mapped[str] = mapped_column(Text, default="[]")        # [{title, description, confidence, paper_count}]
    open_questions: Mapped[str] = mapped_column(Text, default="[]")  # [str]
    clusters: Mapped[str] = mapped_column(Text, default="[]")        # [{theme, gaps:[str]}]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    def top_gaps_list(self) -> list:
        try:
            return json.loads(self.top_gaps)
        except Exception:
            return []

    def open_questions_list(self) -> list:
        try:
            return json.loads(self.open_questions)
        except Exception:
            return []

    def clusters_list(self) -> list:
        try: return json.loads(self.clusters)
        except: return []


# ── users ──────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[int]  = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    profile: Mapped["UserProfile"] = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")


class UserProfile(Base):
    """Stores personalization preferences for a registered user."""
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    interests: Mapped[str] = mapped_column(Text, default="[]")           # JSON list
    skill_level: Mapped[str] = mapped_column(String(50), default="intermediate")
    prefer_recent: Mapped[bool] = mapped_column(Boolean, default=False)
    goal: Mapped[str] = mapped_column(String(50), default="research")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    user: Mapped["User"] = relationship("User", back_populates="profile")

    def interests_list(self) -> list[str]:
        try: return json.loads(self.interests)
        except: return []

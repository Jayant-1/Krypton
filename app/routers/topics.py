"""
app/routers/topics.py

POST /api/topics/suggest
  — Accepts user profile (interests, skill_level, goal)
  — Calls Gemini to generate 8 personalised topic suggestions
  — Cached in memory by profile hash (TTL 30min)
"""
from __future__ import annotations

import hashlib
import logging

from fastapi import APIRouter

from app.models.schemas import TopicSuggestRequest, TopicSuggestResponse, TopicItem
from app.services.topic_service import suggest_topics
from app.services.cache_service import get_cache

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Topics"])


@router.post("/topics/suggest", response_model=TopicSuggestResponse)
async def suggest_research_topics(request: TopicSuggestRequest):
    """
    Generate 8 personalised research topic suggestions based on user profile.

    Results are cached in-memory keyed by the profile hash.
    """
    # Build a deterministic cache key from the profile
    profile_str = f"{sorted(request.interests)}|{request.skill_level}|{request.goal}"
    cache_key = "topics:" + hashlib.md5(profile_str.encode()).hexdigest()[:12]

    cache = get_cache()
    cached = cache.get(cache_key)
    if cached:
        logger.info("Topic suggestion cache hit")
        return TopicSuggestResponse(**cached)

    result = await suggest_topics(
        interests=request.interests,
        skill_level=request.skill_level,
        goal=request.goal,
    )

    cache.set(cache_key, result)
    return TopicSuggestResponse(**result)

"""
app/services/topic_service.py

Gemini-powered Topic Discovery.

Given a user profile (interests, skill_level, goal), generates
8 personalised research topic suggestions with:
  - Topic name
  - Description (why it's relevant to this user)
  - Difficulty level
  - Hot score (trending-ness, 1-10)
  - Suggested query (ready to pass to /api/search)
"""
from __future__ import annotations

import json
import logging
import re

from app.services.ai_service import _safe_generate, _extract_json

logger = logging.getLogger(__name__)

TOPIC_PROMPT = """You are an expert academic research advisor.

Generate 8 personalised research topic suggestions for this user:
- Interests: {interests}
- Skill level: {skill_level}
- Goal: {goal}

For each topic return a JSON object. Reply with ONLY a valid JSON array, no markdown:
[
  {{
    "name": "Topic name (3-6 words)",
    "description": "Why this topic is relevant and exciting for this specific user (2 sentences max)",
    "difficulty": "Beginner|Intermediate|Advanced",
    "hot_score": <integer 1-10 — how fast-growing/trendy this topic is right now>,
    "suggested_query": "A specific search query string for this topic (4-8 words)"
  }}
]

Rules:
- Match difficulty to the user's skill level (don't suggest all Advanced for beginners)
- Match relevance to stated interests — be specific, not generic
- hot_score >= 7 means actively published in 2023-2025
- suggested_query must be a good arXiv/OpenAlex search query
- Return EXACTLY 8 topics
"""


def _parse_topics(text: str) -> list[dict]:
    """Parse topic JSON array from Gemini response — handles thinking tokens."""
    # Strip thinking tokens and code fences
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()
    text = re.sub(r'```(?:json)?', '', text, flags=re.IGNORECASE).replace('```', '').strip()

    # Try direct parse as array
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # Try to find a [...] array block
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if not match:
            logger.warning("Topic parse failed — no JSON array found: %s", text[:300])
            return []
        try:
            data = json.loads(match.group())
        except json.JSONDecodeError as e:
            logger.warning("Topic parse failed: %s", e)
            return []

    if not isinstance(data, list):
        data = data.get("topics", [])
    out = []
    for t in data[:8]:
        if isinstance(t, dict):
            out.append({
                "name":            str(t.get("name", "Unknown")),
                "description":     str(t.get("description", "")),
                "difficulty":      str(t.get("difficulty", "Intermediate")),
                "hot_score":       int(t.get("hot_score", 5)),
                "suggested_query": str(t.get("suggested_query", "")),
            })
    return out


def _fallback_topics(interests: list[str]) -> list[dict]:
    """Return generic topics when Gemini fails."""
    base = interests[0] if interests else "machine learning"
    return [{
        "name": f"{base} Overview",
        "description": "An introduction to key concepts and recent advances.",
        "difficulty": "Beginner",
        "hot_score": 7,
        "suggested_query": f"{base} survey recent advances",
    }]


def _build_profile_summary(interests: list[str], skill_level: str, goal: str) -> str:
    level_map = {"beginner": "beginners", "intermediate": "intermediate researchers",
                 "advanced": "advanced researchers", "all": "all researchers"}
    goal_map = {"research": "conducting research", "learning": "learning",
                "startup": "building startups"}
    interests_str = ", ".join(interests[:3]) if interests else "general topics"
    return (
        f"For {level_map.get(skill_level, 'researchers')} interested in "
        f"{interests_str}, focused on {goal_map.get(goal, 'research')}"
    )


async def suggest_topics(
    interests: list[str],
    skill_level: str = "all",
    goal: str = "research",
) -> dict:
    """Call Gemini to generate personalised topic suggestions."""
    interests_str = ", ".join(interests) if interests else "general AI and machine learning"
    prompt = TOPIC_PROMPT.format(
        interests=interests_str,
        skill_level=skill_level if skill_level != "all" else "intermediate",
        goal=goal,
    )

    raw = _safe_generate(prompt)
    if raw is None:
        logger.error("Gemini returned None for topic suggestion")
        topics = _fallback_topics(interests)
    else:
        topics = _parse_topics(raw)
        if not topics:
            topics = _fallback_topics(interests)

    return {
        "topics": topics,
        "profile_summary": _build_profile_summary(interests, skill_level, goal),
    }

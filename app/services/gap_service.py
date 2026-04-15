"""
app/services/gap_service.py

Gemini-powered Research Gap Detection.

Given a list of paper abstracts from a search session, this module:
  1. Batches abstracts into a single Gemini prompt
  2. Extracts top research gaps (with confidence + paper count)
  3. Identifies open research questions
  4. Clusters gaps by theme
"""
from __future__ import annotations

import json
import logging
import re

from app.services.ai_service import _safe_generate, _extract_json

logger = logging.getLogger(__name__)

# ── Prompt ─────────────────────────────────────────────────────────────────────

GAP_PROMPT = """You are an expert academic research analyst.

I will give you abstracts from {n} research papers on the topic: "{query}"

Your task: Identify the RESEARCH GAPS and UNRESOLVED PROBLEMS across these papers.

Return ONLY a valid JSON object with exactly these keys (no extra text, no markdown):
{{
  "top_gaps": [
    {{
      "title": "Short gap title (4-7 words)",
      "description": "What is unresolved and why it matters for future research (2-3 sentences)",
      "confidence": <integer 1-10 — how strongly supported across papers>,
      "paper_count": <integer — how many papers mention or imply this gap>
    }}
  ],
  "open_questions": [
    "Precise open research question (one sentence ending with ?).",
    "..."
  ],
  "clusters": [
    {{
      "theme": "Theme name (1-3 words)",
      "gaps": ["gap title 1", "gap title 2"]
    }}
  ]
}}

Rules:
- top_gaps: 3-6 gaps, ordered by confidence descending
- open_questions: 4-7 questions
- clusters: 2-4 clusters grouping the top_gaps by common theme
- Be specific and academically rigorous — not generic
- Base confidence and paper_count ONLY on evidence in the provided abstracts

--- PAPER ABSTRACTS ---
{abstracts}
--- END ---"""


def _build_prompt(query: str, papers: list[dict]) -> str:
    """Build a batched prompt from up to 10 paper abstracts."""
    selected = papers[:10]  # cap at 10 papers to stay within token limit
    abstract_blocks = []
    for i, p in enumerate(selected, 1):
        title    = p.get("title", "Untitled")[:200]
        abstract = p.get("abstract", "")[:600]  # truncate each abstract
        abstract_blocks.append(f"[{i}] {title}\n{abstract}")

    return GAP_PROMPT.format(
        n=len(selected),
        query=query,
        abstracts="\n\n".join(abstract_blocks),
    )


def _parse_gap_response(text: str) -> dict:
    """Parse JSON from Gemini response — handles thinking tokens and code fences."""
    logger.warning("GAP RAW RESPONSE (first 800 chars): %s", text[:800])
    data = _extract_json(text)
    if data:
        return {
            "top_gaps":       _validate_gaps(data.get("top_gaps", [])),
            "open_questions": _validate_questions(data.get("open_questions", [])),
            "clusters":       _validate_clusters(data.get("clusters", [])),
        }
    logger.warning("Gap response JSON parse failed: %s", text[:300])
    return _fallback_response()


def _validate_gaps(gaps: list) -> list:
    out = []
    for g in gaps[:6]:
        if isinstance(g, dict):
            out.append({
                "title":       str(g.get("title", "Unknown gap")),
                "description": str(g.get("description", "")),
                "confidence":  int(g.get("confidence", 5)),
                "paper_count": int(g.get("paper_count", 1)),
            })
    return out


def _validate_questions(questions: list) -> list:
    return [str(q) for q in questions[:7] if isinstance(q, str)]


def _validate_clusters(clusters: list) -> list:
    out = []
    for c in clusters[:4]:
        if isinstance(c, dict):
            out.append({
                "theme": str(c.get("theme", "General")),
                "gaps":  [str(g) for g in c.get("gaps", [])[:4]],
            })
    return out


def _fallback_response() -> dict:
    return {
        "top_gaps": [{
            "title": "Analysis unavailable",
            "description": "Gemini could not parse the response. Try again.",
            "confidence": 0,
            "paper_count": 0,
        }],
        "open_questions": ["Could not extract research questions at this time."],
        "clusters": [],
    }


async def analyze_research_gaps(query: str, papers: list[dict]) -> dict:
    """
    Main entrypoint: send papers to Gemini, return structured gap analysis.

    Args:
        query:  The original search query.
        papers: List of paper dicts from the search result (need 'title', 'abstract').

    Returns:
        dict with keys: top_gaps, open_questions, clusters
    """
    if not papers:
        return _fallback_response()

    prompt = _build_prompt(query, papers)
    raw = _safe_generate(prompt)

    if raw is None:
        logger.error("Gemini returned None for gap analysis")
        return _fallback_response()

    return _parse_gap_response(raw)

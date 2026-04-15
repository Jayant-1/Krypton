"""
app/services/ai_service.py

Uses Google Gemini (gemini-1.5-flash) via the new google-genai SDK for:
  1. Summarisation   — 3-5 sentence plain-English summary + key contribution
  2. Insight extraction — structured {problem, method, result, limitation}

Both functions are on-demand (called only when the user clicks a button)
and their results are cached by paper_id.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Optional, Tuple

from google import genai

from app.config import get_settings
from app.models.schemas import InsightResponse, SummaryResponse

logger = logging.getLogger(__name__)


def _safe_generate(prompt: str) -> Optional[str]:
    """Call Gemini and return text, or None on failure. Retries on 429."""
    import time
    cfg = get_settings()
    if not cfg.gemini_api_key or cfg.gemini_api_key == "your_gemini_api_key_here":
        logger.error("GEMINI_API_KEY is not set or still has the placeholder value in .env")
        return None

    client = genai.Client(api_key=cfg.gemini_api_key)
    backoff = 20  # seconds — free tier RPM is low, need a real pause

    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model=cfg.gemini_model,
                contents=prompt,
            )
            raw = response.text.strip()
            # Gemini 2.5 thinking models emit <think>…</think> blocks — strip them
            raw = re.sub(r'<think>.*?</think>', '', raw, flags=re.DOTALL).strip()
            return raw
        except Exception as exc:
            err = str(exc)
            if "429" in err or "RESOURCE_EXHAUSTED" in err:
                if attempt < 2:
                    logger.warning(
                        "Gemini rate limit hit (attempt %d/3), waiting %ds...",
                        attempt + 1, backoff
                    )
                    time.sleep(backoff)
                    backoff *= 2
                    continue
            logger.error("Gemini generation error (%s): %s", type(exc).__name__, exc)
            return None
    return None


def _extract_json(text: str) -> Optional[dict]:
    """
    Robustly extract the first JSON object from a Gemini response.
    Handles: markdown fences, thinking tokens, leading/trailing prose,
             greedy vs non-greedy JSON boundaries.
    """
    if not text:
        return None

    # 1. Strip ALL markdown code fences (case-insensitive, with or without language tag)
    text = re.sub(r'```[\w]*\n?', '', text, flags=re.IGNORECASE)
    text = text.replace('```', '').strip()

    # 2. Direct parse (cleanest case)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 3. Find first '{' and last '}' — greedy extraction
    start = text.find('{')
    end   = text.rfind('}')
    if start != -1 and end != -1 and end > start:
        candidate = text[start:end + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    # 4. Regex: non-greedy (for shorter embedded objects)
    for match in re.finditer(r'\{.*?\}', text, re.DOTALL):
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            continue

    logger.warning("_extract_json: could not find parseable JSON in: %s", text[:400])
    return None


# ── Summarisation ─────────────────────────────────────────────────────────────

SUMMARY_PROMPT = """You are a research assistant helping students understand academic papers.

Given the research paper title and abstract below, do the following:
1. Write a clear, jargon-free summary in EXACTLY 3-5 sentences suitable for a university student.
2. Write ONE sentence describing the single most important contribution.

Return your answer in this EXACT format (no extra text, no markdown):
SUMMARY: <your 3-5 sentence summary here>
CONTRIBUTION: <your single contribution sentence here>

Title: {title}
Abstract: {abstract}"""


def _parse_summary_response(text: str) -> Tuple[str, str]:
    """Extract SUMMARY and CONTRIBUTION from the model response."""
    summary = ""
    contribution = ""

    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("SUMMARY:"):
            summary = stripped[len("SUMMARY:"):].strip()
        elif stripped.startswith("CONTRIBUTION:"):
            contribution = stripped[len("CONTRIBUTION:"):].strip()

    if not summary:
        summary = text[:500]
    if not contribution:
        contribution = "See summary above."

    return summary, contribution


async def generate_summary(
    paper_id: str,
    title: str,
    abstract: str,
) -> SummaryResponse:
    """Generate a plain-English summary and key contribution sentence."""
    prompt = SUMMARY_PROMPT.format(
        title=title,
        abstract=abstract[:3000],
    )

    raw = _safe_generate(prompt)
    if raw is None:
        return SummaryResponse(
            paper_id=paper_id,
            title=title,
            summary="Summary unavailable — Gemini API error. Check your GEMINI_API_KEY in .env",
            key_contribution="Unavailable.",
            cached=False,
        )

    summary, contribution = _parse_summary_response(raw)
    return SummaryResponse(
        paper_id=paper_id,
        title=title,
        summary=summary,
        key_contribution=contribution,
        cached=False,
    )


# ── Insight Extraction ────────────────────────────────────────────────────────

INSIGHT_PROMPT = """You are an expert research analyst. Extract structured insights from the research paper below.

Return ONLY a valid JSON object with these exact keys:
{{
  "problem": "The specific problem or gap this paper addresses (1-2 sentences)",
  "method": "The approach, algorithm, or methodology used (1-2 sentences)",
  "result": "Key findings, metrics, or outcomes achieved (1-2 sentences)",
  "limitation": "Stated or inferred limitations or future work (1-2 sentences)"
}}

Do NOT include any text outside the JSON object.

Title: {title}
Abstract: {abstract}"""


def _parse_insight_response(text: str) -> dict:
    """Extract the JSON object from the model response."""
    data = _extract_json(text)
    if data:
        return {
            "problem":    str(data.get("problem",    "Not specified.")),
            "method":     str(data.get("method",     "Not specified.")),
            "result":     str(data.get("result",     "Not specified.")),
            "limitation": str(data.get("limitation", "Not specified.")),
        }
    logger.warning("Could not parse JSON from Gemini response: %s", text[:200])
    return {
        "problem":    "Could not parse structured insights.",
        "method":     "See abstract for details.",
        "result":     "See abstract for details.",
        "limitation": "Not specified.",
    }


async def generate_insights(
    paper_id: str,
    title: str,
    abstract: str,
) -> InsightResponse:
    """Extract structured insights: problem, method, result, limitation."""
    prompt = INSIGHT_PROMPT.format(
        title=title,
        abstract=abstract[:3000],
    )

    raw = _safe_generate(prompt)
    if raw is None:
        return InsightResponse(
            paper_id=paper_id,
            title=title,
            problem="Insight extraction unavailable — Gemini API error.",
            method="Please set GEMINI_API_KEY in your .env file.",
            result="Unavailable.",
            limitation="Unavailable.",
            cached=False,
        )

    parsed = _parse_insight_response(raw)
    return InsightResponse(
        paper_id=paper_id,
        title=title,
        cached=False,
        **parsed,
    )

"""
app/services/semantic_scholar_service.py

Fetches papers from the Semantic Scholar Graph API.
Handles rate limiting with exponential backoff and deduplication against
arXiv results.
"""
from __future__ import annotations

import logging
import time
from difflib import SequenceMatcher
from typing import List, Optional

import requests

from app.config import get_settings
from app.models.schemas import Domain, Paper, PaperSource

logger = logging.getLogger(__name__)

S2_BASE_URL = "https://api.semanticscholar.org/graph/v1"
S2_FIELDS = "title,abstract,authors,year,citationCount,externalIds,url,openAccessPdf"

DOMAIN_KEYWORD_MAP: dict[str, list[str]] = {
    Domain.AI: ["artificial intelligence", "machine learning"],
    Domain.ML: ["machine learning", "deep learning", "neural network"],
    Domain.NLP: ["natural language processing", "language model", "NLP"],
    Domain.CV: ["computer vision", "image recognition", "object detection"],
    Domain.HEALTHCARE: ["medical", "clinical", "healthcare", "biomedical"],
    Domain.ROBOTICS: ["robotics", "robot", "autonomous"],
    Domain.DATA_SCIENCE: ["data science", "data analysis", "statistics"],
    Domain.SECURITY: ["cybersecurity", "adversarial", "security"],
    Domain.ALL: [],
}


def _get_headers() -> dict:
    cfg = get_settings()
    headers = {"Accept": "application/json"}
    if cfg.semantic_scholar_api_key:
        headers["x-api-key"] = cfg.semantic_scholar_api_key
    return headers


def _build_enriched_query(query: str, domain: Domain) -> str:
    extras = DOMAIN_KEYWORD_MAP.get(domain, [])
    if not extras or domain == Domain.ALL:
        return query
    return query  # S2 doesn't support category params; domain filtered post-fetch


def _normalize_paper(item: dict) -> Optional[Paper]:
    """Convert a Semantic Scholar API item into our Paper schema."""
    title = (item.get("title") or "").strip()
    abstract = (item.get("abstract") or "").strip()
    if not title:
        return None

    external_ids = item.get("externalIds") or {}
    arxiv_id = external_ids.get("ArXiv")
    doi = external_ids.get("DOI")

    # Prefer arXiv link if available, fall back to S2 URL
    if arxiv_id:
        link = f"https://arxiv.org/abs/{arxiv_id}"
        paper_id = f"s2_arxiv_{arxiv_id}"
    else:
        link = item.get("url") or f"https://www.semanticscholar.org/paper/{item.get('paperId','')}"
        paper_id = f"s2_{item.get('paperId', '')}"

    # Open-access PDF
    pdf_info = item.get("openAccessPdf")
    if pdf_info and pdf_info.get("url"):
        link = pdf_info["url"]

    authors = [a.get("name", "") for a in (item.get("authors") or []) if a.get("name")]
    year = item.get("year")
    citations = item.get("citationCount") or 0

    return Paper(
        id=paper_id,
        title=title,
        abstract=abstract,
        authors=authors,
        year=year,
        link=link,
        source=PaperSource.SEMANTIC_SCHOLAR,
        doi=doi,
        citation_count=citations,
    )


def _is_duplicate(paper: Paper, existing: List[Paper], threshold: float = 0.85) -> bool:
    """Check if a paper title is too similar to any already-collected paper."""
    for ex in existing:
        ratio = SequenceMatcher(None, paper.title.lower(), ex.title.lower()).ratio()
        if ratio >= threshold:
            return True
    return False


def _fetch_with_retry(url: str, params: dict, headers: dict, retries: int = 3) -> Optional[dict]:
    backoff = 2
    for attempt in range(retries):
        try:
            response = requests.get(url, params=params, headers=headers, timeout=15)
            if response.status_code == 200:
                return response.json()
            if response.status_code == 429:
                logger.warning("S2 rate limit hit, waiting %ds (attempt %d)...", backoff, attempt + 1)
                time.sleep(backoff)
                backoff *= 2
                continue
            logger.warning("S2 returned status %d", response.status_code)
            return None
        except requests.RequestException as exc:
            logger.warning("S2 request error: %s (attempt %d)", exc, attempt + 1)
            time.sleep(backoff)
            backoff *= 2
    return None


async def fetch_semantic_scholar_papers(
    query: str,
    domain: Domain = Domain.ALL,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
    max_results: int = 20,
    existing_papers: Optional[List[Paper]] = None,
) -> List[Paper]:
    """
    Fetch papers from Semantic Scholar, deduplicate against existing_papers.
    """
    headers = _get_headers()
    params: dict = {
        "query": query,
        "limit": min(max_results * 2, 100),
        "fields": S2_FIELDS,
    }
    if year_from and year_to:
        params["year"] = f"{year_from}-{year_to}"
    elif year_from:
        params["year"] = f"{year_from}-"
    elif year_to:
        params["year"] = f"-{year_to}"

    url = f"{S2_BASE_URL}/paper/search"
    data = _fetch_with_retry(url, params, headers)
    if not data:
        return []

    raw_items = data.get("data", [])
    collected: List[Paper] = []
    seen = list(existing_papers or [])

    for item in raw_items:
        paper = _normalize_paper(item)
        if not paper:
            continue

        # Skip if abstract is empty (not useful for AI processing)
        if not paper.abstract:
            continue

        # Skip duplicates
        if _is_duplicate(paper, seen):
            continue

        collected.append(paper)
        seen.append(paper)

        if len(collected) >= max_results:
            break

    logger.info("Semantic Scholar returned %d papers for query '%s'", len(collected), query)
    return collected

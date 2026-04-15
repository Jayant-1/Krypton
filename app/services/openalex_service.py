"""
app/services/openalex_service.py

Fetches papers and citation counts from OpenAlex API.
- Completely free, no API key required
- 100,000 requests/day on polite pool (just add email as param)
- Provides citation counts for arXiv papers via arXiv ID lookup

Two public functions:
  1. fetch_openalex_papers()  — search papers (replaces Semantic Scholar)
  2. enrich_with_citations()  — backfill citation counts for arXiv papers
"""
from __future__ import annotations

import logging
import time
from difflib import SequenceMatcher
from typing import List, Optional

import requests

from app.models.schemas import Domain, Paper, PaperSource

logger = logging.getLogger(__name__)

OPENALEX_BASE = "https://api.openalex.org"
# Using polite pool — faster response with an email identifier (no auth needed)
POLITE_EMAIL = "research-assistant-bot@example.com"

# OpenAlex concept IDs for domain filtering
DOMAIN_CONCEPT_MAP: dict[str, list[str]] = {
    Domain.AI: ["C154945302", "C119857082"],        # AI, ML
    Domain.ML: ["C119857082", "C2522767166"],       # ML, Deep Learning
    Domain.NLP: ["C204321447"],                      # NLP
    Domain.CV: ["C31972630"],                        # Computer Vision
    Domain.HEALTHCARE: ["C71924100", "C126322002"],  # Medicine, Biology
    Domain.ROBOTICS: ["C19038748"],                  # Robotics
    Domain.DATA_SCIENCE: ["C119857082", "C124952707"],  # ML, Statistics
    Domain.SECURITY: ["C38652104"],                  # Cybersecurity
    Domain.ALL: [],
}


def _get_params(extra: dict | None = None) -> dict:
    params = {"mailto": POLITE_EMAIL}
    if extra:
        params.update(extra)
    return params


def _normalize_paper(item: dict) -> Optional[Paper]:
    """Convert an OpenAlex work item into our Paper schema."""
    title = (item.get("title") or "").strip()
    if not title:
        return None

    # Abstract — OpenAlex stores it as inverted index, reconstruct it
    abstract = _reconstruct_abstract(item.get("abstract_inverted_index"))

    # Authors
    authorships = item.get("authorships") or []
    authors = [
        a["author"]["display_name"]
        for a in authorships
        if a.get("author") and a["author"].get("display_name")
    ]

    year = item.get("publication_year")
    citations = item.get("cited_by_count") or 0

    # IDs
    ids = item.get("ids") or {}
    arxiv_id = _extract_arxiv_id(ids.get("arxiv") or "")
    doi = ids.get("doi", "").replace("https://doi.org/", "") if ids.get("doi") else None

    # Best link: prefer arXiv, then DOI, then OpenAlex landing page
    if arxiv_id:
        link = f"https://arxiv.org/abs/{arxiv_id}"
        paper_id = f"oa_arxiv_{arxiv_id}"
    elif doi:
        link = f"https://doi.org/{doi}"
        paper_id = f"oa_{item.get('id', '').split('/')[-1]}"
    else:
        link = item.get("id") or ""
        paper_id = f"oa_{item.get('id', '').split('/')[-1]}"

    return Paper(
        id=paper_id,
        title=title,
        abstract=abstract,
        authors=authors,
        year=year,
        link=link,
        source=PaperSource.SEMANTIC_SCHOLAR,  # re-uses "external" source tag
        doi=doi,
        citation_count=citations,
    )


def _reconstruct_abstract(inverted_index: dict | None) -> str:
    """
    OpenAlex stores abstracts as {word: [positions]}.
    Reconstruct the original text by sorting positions.
    """
    if not inverted_index:
        return ""
    try:
        word_positions: list[tuple[int, str]] = []
        for word, positions in inverted_index.items():
            for pos in positions:
                word_positions.append((pos, word))
        word_positions.sort(key=lambda x: x[0])
        return " ".join(w for _, w in word_positions)
    except Exception:
        return ""


def _extract_arxiv_id(arxiv_url: str) -> str:
    """Extract bare arXiv ID from a URL like https://arxiv.org/abs/2305.10601"""
    if not arxiv_url:
        return ""
    parts = arxiv_url.rstrip("/").split("/")
    return parts[-1] if parts else ""


def _is_duplicate(paper: Paper, existing: List[Paper], threshold: float = 0.85) -> bool:
    for ex in existing:
        ratio = SequenceMatcher(None, paper.title.lower(), ex.title.lower()).ratio()
        if ratio >= threshold:
            return True
    return False


def _fetch_with_retry(url: str, params: dict, retries: int = 3) -> Optional[dict]:
    backoff = 2
    for attempt in range(retries):
        try:
            resp = requests.get(url, params=params, timeout=15)
            if resp.status_code == 200:
                return resp.json()
            if resp.status_code == 429:
                logger.warning("OpenAlex rate limit hit, retrying in %ds", backoff)
                time.sleep(backoff)
                backoff *= 2
                continue
            logger.warning("OpenAlex returned HTTP %d", resp.status_code)
            return None
        except requests.RequestException as exc:
            logger.warning("OpenAlex request error: %s (attempt %d)", exc, attempt + 1)
            time.sleep(backoff)
            backoff *= 2
    return None


# ── Main search function ──────────────────────────────────────────────────────

async def fetch_openalex_papers(
    query: str,
    domain: Domain = Domain.ALL,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
    max_results: int = 20,
    existing_papers: Optional[List[Paper]] = None,
) -> List[Paper]:
    """
    Search OpenAlex for papers matching the query.
    Returns normalized Paper objects with real citation counts.
    """
    params = _get_params({
        "search": query,
        "per-page": min(max_results * 2, 50),
        "sort": "relevance_score:desc",
        "select": "id,title,abstract_inverted_index,authorships,publication_year,cited_by_count,ids,primary_location",
    })

    # Year filter
    filters = ["has_abstract:true"]
    if year_from and year_to:
        filters.append(f"publication_year:{year_from}-{year_to}")
    elif year_from:
        filters.append(f"publication_year:>{year_from - 1}")
    elif year_to:
        filters.append(f"publication_year:<{year_to + 1}")

    # Domain concept filter
    concepts = DOMAIN_CONCEPT_MAP.get(domain, [])
    if concepts:
        filters.append(f"concepts.id:{'|'.join(concepts)}")

    if filters:
        params["filter"] = ",".join(filters)

    data = _fetch_with_retry(f"{OPENALEX_BASE}/works", params)
    if not data:
        logger.warning("OpenAlex returned no data for query '%s'", query)
        return []

    results = data.get("results") or []
    collected: List[Paper] = []
    seen = list(existing_papers or [])

    for item in results:
        paper = _normalize_paper(item)
        if not paper or not paper.abstract:
            continue
        if _is_duplicate(paper, seen):
            continue
        collected.append(paper)
        seen.append(paper)
        if len(collected) >= max_results:
            break

    logger.info("OpenAlex returned %d papers for query '%s'", len(collected), query)
    return collected


# ── Citation enrichment for arXiv papers ─────────────────────────────────────

async def enrich_with_citations(papers: List[Paper]) -> List[Paper]:
    """
    For papers with citation_count == 0 (e.g. raw arXiv results),
    look them up on OpenAlex by arXiv ID and backfill citation counts.
    Does a single batch API call using filter=ids.arxiv:id1|id2|...
    """
    arxiv_papers = [
        p for p in papers
        if p.citation_count == 0 and "arxiv_" in p.id
    ]
    if not arxiv_papers:
        return papers

    # Extract raw arXiv IDs (strip version suffix like v1, v2)
    def _bare_id(paper: Paper) -> str:
        raw = paper.id.replace("arxiv_", "")
        return raw.split("v")[0]   # e.g. "2305.10601v2" → "2305.10601"

    id_map = {_bare_id(p): p for p in arxiv_papers}
    arxiv_ids = list(id_map.keys())

    # OpenAlex batch filter supports up to 50 IDs separated by |
    batch_size = 50
    for i in range(0, len(arxiv_ids), batch_size):
        batch = arxiv_ids[i: i + batch_size]
        filter_str = "ids.arxiv:" + "|".join(batch)
        params = _get_params({
            "filter": filter_str,
            "select": "ids,cited_by_count",
            "per-page": batch_size,
        })

        data = _fetch_with_retry(f"{OPENALEX_BASE}/works", params)
        if not data:
            continue

        for item in (data.get("results") or []):
            ids = item.get("ids") or {}
            arxiv_url = ids.get("arxiv") or ""
            bare = _extract_arxiv_id(arxiv_url).split("v")[0]
            citations = item.get("cited_by_count") or 0

            if bare in id_map:
                id_map[bare].citation_count = citations
                logger.debug("Enriched arXiv:%s → %d citations", bare, citations)

    enriched_count = sum(1 for p in arxiv_papers if p.citation_count > 0)
    logger.info("Citation enrichment: %d/%d arXiv papers got citation counts",
                enriched_count, len(arxiv_papers))
    return papers

"""
app/services/arxiv_service.py

Fetches papers from the arXiv API using the `arxiv` Python library.
Normalizes results into our Paper schema.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import List, Optional

import arxiv

from app.models.schemas import Domain, Paper, PaperSource

logger = logging.getLogger(__name__)

# arXiv category map per domain
DOMAIN_CATEGORY_MAP: dict[str, list[str]] = {
    Domain.AI: ["cs.AI", "cs.LG"],
    Domain.ML: ["cs.LG", "stat.ML"],
    Domain.NLP: ["cs.CL"],
    Domain.CV: ["cs.CV"],
    Domain.HEALTHCARE: ["q-bio", "eess.IV", "cs.LG"],
    Domain.ROBOTICS: ["cs.RO"],
    Domain.DATA_SCIENCE: ["cs.LG", "stat.ML", "cs.DB"],
    Domain.SECURITY: ["cs.CR"],
    Domain.ALL: [],
}


def _build_query(query: str, domain: Domain) -> str:
    """Build the arXiv query string with optional category filter."""
    categories = DOMAIN_CATEGORY_MAP.get(domain, [])
    if not categories:
        return query
    cat_filter = " OR ".join(f"cat:{c}" for c in categories)
    return f"({query}) AND ({cat_filter})"


def _normalize_paper(result: arxiv.Result) -> Paper:
    """Convert an arxiv.Result into our Paper schema."""
    paper_id = result.entry_id.split("/abs/")[-1]  # e.g. "2305.10601v1"
    year = result.published.year if result.published else None

    return Paper(
        id=f"arxiv_{paper_id}",
        title=result.title.strip(),
        abstract=(result.summary or "").strip(),
        authors=[a.name for a in result.authors],
        year=year,
        link=result.entry_id,
        source=PaperSource.ARXIV,
        doi=result.doi,
        citation_count=0,  # arXiv does not provide citation counts
    )


async def fetch_arxiv_papers(
    query: str,
    domain: Domain = Domain.ALL,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
    max_results: int = 20,
) -> List[Paper]:
    """
    Asynchronously (via thread-safe client) fetch papers from arXiv.
    Returns a list of normalized Paper objects.
    """
    arxiv_query = _build_query(query, domain)
    client = arxiv.Client(page_size=max_results, delay_seconds=1, num_retries=3)

    search = arxiv.Search(
        query=arxiv_query,
        max_results=max_results * 2,          # fetch extra to allow year filtering
        sort_by=arxiv.SortCriterion.Relevance,
        sort_order=arxiv.SortOrder.Descending,
    )

    papers: List[Paper] = []
    try:
        for result in client.results(search):
            paper = _normalize_paper(result)

            # Filter by year range
            if year_from and paper.year and paper.year < year_from:
                continue
            if year_to and paper.year and paper.year > year_to:
                continue

            papers.append(paper)
            if len(papers) >= max_results:
                break
    except Exception as exc:
        logger.warning("arXiv fetch error: %s", exc)

    logger.info("arXiv returned %d papers for query '%s'", len(papers), query)
    return papers

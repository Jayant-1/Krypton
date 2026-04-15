"""
app/services/ranking_service.py

Ranks a list of papers using a weighted combination of:
  - Relevance      (TF-IDF cosine similarity between query and abstract)
  - Recency        (linear year decay)
  - Citations      (log-normalised citation count)
  - Interest Match (keyword overlap with user interests — only when profile provided)

Default:     0.40 × relevance + 0.30 × recency + 0.30 × citation
Personalised: 0.30 × relevance + 0.25 × recency + 0.20 × citation + 0.25 × interest
              (recency boosted to 0.35/0.20 when prefer_recent=True)
"""
from __future__ import annotations

import logging
import math
from typing import List

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.models.schemas import Paper

logger = logging.getLogger(__name__)

CURRENT_YEAR = 2026
MIN_YEAR = 1990


def _compute_relevance_scores(query: str, papers: List[Paper]) -> List[float]:
    """TF-IDF cosine similarity between the query and each paper's abstract."""
    if not papers:
        return []
    documents = [f"{p.title} {p.abstract}" for p in papers]
    corpus = [query] + documents
    try:
        vectorizer = TfidfVectorizer(stop_words="english", max_features=10_000)
        tfidf_matrix = vectorizer.fit_transform(corpus)
        query_vec = tfidf_matrix[0:1]
        doc_vecs = tfidf_matrix[1:]
        scores = cosine_similarity(query_vec, doc_vecs)[0]
        return scores.tolist()
    except Exception as exc:
        logger.warning("TF-IDF computation failed: %s — falling back to 0.5", exc)
        return [0.5] * len(papers)


def _compute_recency_scores(papers: List[Paper]) -> List[float]:
    """Linear decay from MIN_YEAR to CURRENT_YEAR → score in [0, 1]."""
    scores = []
    year_range = CURRENT_YEAR - MIN_YEAR or 1
    for p in papers:
        year = max(MIN_YEAR, min(CURRENT_YEAR, p.year or MIN_YEAR))
        scores.append((year - MIN_YEAR) / year_range)
    return scores


def _compute_citation_scores(papers: List[Paper]) -> List[float]:
    """Log-normalised citation counts → score in [0, 1]."""
    citations = [p.citation_count for p in papers]
    max_log = math.log1p(max(citations)) if citations else 1.0
    if max_log == 0:
        max_log = 1.0
    return [math.log1p(c) / max_log for c in citations]


def _compute_interest_scores(interests: List[str], papers: List[Paper]) -> List[float]:
    """
    Keyword overlap between user interests and paper title+abstract.
    Uses TF-IDF: treats the combined interest string as a query.
    Returns scores in [0, 1].
    """
    if not interests or not papers:
        return [0.0] * len(papers)

    interest_query = " ".join(interests)
    documents = [f"{p.title} {p.abstract}" for p in papers]
    corpus = [interest_query] + documents
    try:
        vectorizer = TfidfVectorizer(stop_words="english", max_features=5_000)
        tfidf_matrix = vectorizer.fit_transform(corpus)
        query_vec = tfidf_matrix[0:1]
        doc_vecs = tfidf_matrix[1:]
        scores = cosine_similarity(query_vec, doc_vecs)[0]
        return scores.tolist()
    except Exception as exc:
        logger.warning("Interest scoring failed: %s", exc)
        return [0.0] * len(papers)


def rank_papers(
    query: str,
    papers: List[Paper],
    user_interests: List[str] | None = None,
    prefer_recent: bool = False,
) -> List[Paper]:
    """
    Compute and attach scores to each paper, then return sorted list.

    Args:
        query:          The search query (used for TF-IDF relevance).
        papers:         Papers to rank.
        user_interests: Optional list of interest keywords from user profile.
        prefer_recent:  If True, boost the recency weight.
    """
    if not papers:
        return []

    relevance = _compute_relevance_scores(query, papers)
    recency   = _compute_recency_scores(papers)
    citation  = _compute_citation_scores(papers)

    personalised = bool(user_interests)
    interests_scores = _compute_interest_scores(user_interests or [], papers) if personalised else []

    for i, paper in enumerate(papers):
        rel = relevance[i]
        rec = recency[i]
        cit = citation[i]

        paper.relevance_score = round(rel, 4)
        paper.recency_score   = round(rec, 4)
        paper.citation_score  = round(cit, 4)

        if personalised:
            interest = interests_scores[i]
            if prefer_recent:
                # Boost recency even more for users who want cutting-edge
                score = 0.30 * rel + 0.35 * rec + 0.10 * cit + 0.25 * interest
            else:
                score = 0.30 * rel + 0.25 * rec + 0.20 * cit + 0.25 * interest
        else:
            if prefer_recent:
                score = 0.35 * rel + 0.40 * rec + 0.25 * cit
            else:
                score = 0.40 * rel + 0.30 * rec + 0.30 * cit

        paper.combined_score = round(score, 4)

    ranked = sorted(papers, key=lambda p: p.combined_score, reverse=True)
    logger.info(
        "Ranked %d papers [personalised=%s prefer_recent=%s]; top=%.4f",
        len(ranked), personalised, prefer_recent,
        ranked[0].combined_score if ranked else 0,
    )
    return ranked

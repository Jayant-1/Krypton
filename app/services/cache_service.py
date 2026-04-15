"""
app/services/cache_service.py

Single-layer in-memory TTL cache.

Disk cache has been removed — SQLite DB (via db_service) is the
persistence layer for all search results, summaries, and insights.
"""
from __future__ import annotations

import hashlib
import time
from typing import Any, Optional


class CacheService:
    def __init__(self, ttl_minutes: int = 30):
        self._ttl_seconds = ttl_minutes * 60
        self._memory: dict[str, dict] = {}  # {key: {"data": ..., "expires_at": float}}

    # ── Public API ────────────────────────────────────────────────────────────

    def get(self, key: str) -> Optional[Any]:
        """Return cached value or None if missing / expired."""
        hit = self._memory.get(key)
        if hit and time.time() < hit["expires_at"]:
            return hit["data"]
        # Clean up expired entry
        self._memory.pop(key, None)
        return None

    def set(self, key: str, value: Any) -> None:
        """Store a value in memory cache."""
        self._memory[key] = {
            "data": value,
            "expires_at": time.time() + self._ttl_seconds,
        }

    def delete(self, key: str) -> None:
        """Remove a single key from memory cache."""
        self._memory.pop(key, None)

    def clear(self) -> None:
        """Clear the entire in-memory cache."""
        self._memory.clear()

    # ── Key helpers ───────────────────────────────────────────────────────────

    @staticmethod
    def make_search_key(
        query: str,
        year_from,
        year_to,
        domain: str,
        max_results: int,
        sources: str,
    ) -> str:
        raw = f"{query}|{year_from}|{year_to}|{domain}|{max_results}|{sources}"
        return "search_" + hashlib.sha256(raw.encode()).hexdigest()[:16]

    @staticmethod
    def make_paper_key(paper_id: str, resource: str) -> str:
        """resource: 'summary' or 'insights'"""
        safe = paper_id.replace("/", "_").replace(".", "_")
        return f"{resource}_{safe}"


# ── Singleton ─────────────────────────────────────────────────────────────────

_cache_service: Optional[CacheService] = None


def get_cache() -> CacheService:
    global _cache_service
    if _cache_service is None:
        from app.config import get_settings
        cfg = get_settings()
        _cache_service = CacheService(ttl_minutes=cfg.cache_ttl_minutes)
    return _cache_service

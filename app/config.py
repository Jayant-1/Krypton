"""
app/config.py — Application settings loaded from .env
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Google Gemini ─────────────────────────────────────────────────────────
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    # ── Semantic Scholar ──────────────────────────────────────────────────────
    semantic_scholar_api_key: str = ""

    # ── Cache ─────────────────────────────────────────────────────────────────
    cache_ttl_minutes: int = 30   # in-memory TTL; DB is the persistence layer

    # ── Search ────────────────────────────────────────────────────────────────
    max_results_default: int = 20
    max_results_limit: int = 50

    # ── App ───────────────────────────────────────────────────────────────────
    app_env: str = "development"
    app_version: str = "1.0.0"

    # ── Auth (JWT) ────────────────────────────────────────────────────────────
    secret_key: str = "default-insecure-key-change-in-production"  # Will fail if not overridden in .env
    algorithm: str = "HS256"
    access_token_expire_days: int = 7

    # ── CORS ───────────────────────────────────────────────────────────────────
    allowed_origins: str = "http://localhost:3000,http://localhost:5173"  # comma-separated list

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()

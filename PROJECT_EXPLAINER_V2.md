# Krypton Project Explainer (Updated Codebase)

## 1. Project Snapshot
Krypton is a full-stack AI research assistant with personalization.

Core capabilities:
- paper search from arXiv + OpenAlex,
- explainable ranking (relevance/recency/citations),
- Gemini-powered summary and insights per paper,
- Gemini-powered research gap analysis across result sets,
- user auth (signup/login with JWT),
- per-user profile preferences (interests, skill level, goal, recent-paper preference),
- Gemini-powered personalized topic suggestions.

Main code areas:
- `app/` -> FastAPI backend
- `frontend/` -> React + Vite frontend

---

## 2. Tech Stack

Backend:
- FastAPI, Uvicorn
- SQLAlchemy async + aiosqlite
- SQLite DB: `research_agent.db`
- Gemini via `google-genai`
- arXiv client + OpenAlex HTTP API
- Ranking: scikit-learn TF-IDF + cosine similarity
- Auth: `python-jose` (JWT) + `passlib[bcrypt]`

Frontend:
- React 19 + Vite 8
- Tailwind CSS
- Framer Motion
- Local storage for token/profile persistence

---

## 3. Runtime Architecture

```text
Browser (React)
   |
   | HTTP /api/*
   v
FastAPI
   |-- In-memory TTL cache
   |-- SQLite (searches, papers, summaries, insights, gaps, users, profiles)
   |-- arXiv API
   |-- OpenAlex API
   |-- Gemini API
```

---

## 4. Backend Structure

`app/main.py`
- creates FastAPI app,
- initializes cache + DB tables on startup,
- mounts routers under `/api`,
- enables permissive CORS in `development`.

Mounted routers:
- `health`
- `search`
- `papers`
- `history`
- `gaps`
- `topics`
- `auth`
- `user`

---

## 5. Configuration (`app/config.py`)

Primary settings:
- `gemini_api_key`
- `gemini_model` (default `gemini-2.5-flash`)
- `cache_ttl_minutes`
- `max_results_default`, `max_results_limit`
- `app_env`, `app_version`
- auth/JWT settings:
  - `secret_key`
  - `algorithm` (default `HS256`)
  - `access_token_expire_days` (default `7`)

---

## 6. Database Model (`app/models/db_models.py`)

Research tables:
- `searches`
- `papers`
- `summaries` (unique per `paper_id`)
- `insights` (unique per `paper_id`)
- `research_gaps` (unique per normalized query)

Auth/personalization tables:
- `users` (`email`, `username`, `hashed_password`, `is_active`)
- `user_profiles` (`interests`, `skill_level`, `prefer_recent`, `goal`)

Relationships:
- one `search` -> many `papers`
- one `user` -> one `user_profile`

---

## 7. API Endpoints (Current Implementation)

Health:
- `GET /api/health`

Search + papers:
- `POST /api/search`
- `GET /api/papers/{paper_id}/summary?title=...&abstract=...`
- `GET /api/papers/{paper_id}/insights?title=...&abstract=...`

History:
- `GET /api/history`
- `GET /api/history/{search_id}`

Gaps:
- `POST /api/gaps/analyze`

Topic discovery:
- `POST /api/topics/suggest`

Auth:
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

User profile:
- `GET /api/user/profile`
- `PUT /api/user/profile`

Note: cache-clear `DELETE` endpoints are not present in current `app/routers/papers.py`.

---

## 8. Search Flow (`POST /api/search`)

Implementation in `app/routers/search.py`:
1. Create cache key from query/filter fields.
2. Check in-memory cache (L1).
3. Check SQLite for identical prior search (L2).
4. Parallel fetch from selected sources:
   - arXiv,
   - OpenAlex (used when source is `semantic_scholar` or `both`).
5. Enrich arXiv papers with citation counts via OpenAlex.
6. Rank papers via `rank_papers(...)`.
7. Persist search + ranked papers.
8. Warm memory cache and return.

Personalization inputs accepted by schema:
- `user_interests`
- `skill_level`
- `prefer_recent`
- `goal`

Ranking currently uses:
- `user_interests`
- `prefer_recent`

---

## 9. Ranking Logic (`app/services/ranking_service.py`)

Signals:
- relevance: TF-IDF(query vs title+abstract)
- recency: linear scale between 1990 and 2026
- citation: log-normalized citations
- interest match: TF-IDF(user interests vs title+abstract), if interests provided

Weighting:
- default: `0.40 rel + 0.30 rec + 0.30 cit`
- personalized: `0.30 rel + 0.25 rec + 0.20 cit + 0.25 interest`
- personalized + prefer recent: `0.30 rel + 0.35 rec + 0.10 cit + 0.25 interest`
- non-personalized + prefer recent: `0.35 rel + 0.40 rec + 0.25 cit`

---

## 10. AI Flows

Summary/insights (`app/services/ai_service.py`):
- uses `_safe_generate()` with retry/backoff on 429,
- strips Gemini `<think>...</think>` output when present,
- robust JSON extraction helper `_extract_json()` for structured responses.

Endpoints:
- summary returns `summary` + `key_contribution`
- insights returns `problem`, `method`, `result`, `limitation`

Gap analysis (`app/services/gap_service.py`):
- batches up to 10 abstracts,
- requests structured JSON (`top_gaps`, `open_questions`, `clusters`),
- validates and normalizes parsed output.

Topic suggestion (`app/services/topic_service.py`):
- prompts Gemini for exactly 8 topics,
- includes difficulty, hot score, suggested query,
- fallback topic generation when Gemini parse fails.

---

## 11. Auth + Profile Flow

Auth service (`app/services/auth_service.py`):
- bcrypt password hashing and verification,
- JWT creation/verification with `sub`, `email`, `username`, `exp`.

Auth endpoints (`app/routers/auth.py`):
- signup creates user + default profile and returns token,
- login verifies password and returns token,
- `/auth/me` decodes token and returns user identity.

User profile endpoints (`app/routers/user.py`):
- `GET /user/profile` loads current user preferences,
- `PUT /user/profile` updates interests/skill/goal/recent preference.

---

## 12. Frontend Architecture

Root flow in `frontend/src/App.jsx`:
- on load: health check + session restore from localStorage,
- if token exists: fetch server profile,
- else: fallback to local profile or onboarding modal,
- enriches search request with profile preferences,
- conditionally renders:
  - static landing sections,
  - topic suggestions,
  - search results,
  - research gaps section,
  - paper insight modal,
  - auth modal,
  - profile modal.

Key API wrapper (`frontend/src/api/client.js`):
- `apiFetch()` adds JWT from `localStorage` when available,
- consistent JSON error handling with `ApiError`.

---

## 13. Frontend Components (Functional Groups)

Authentication/personalization:
- `AuthModal.jsx` (login/signup)
- `UserProfileModal.jsx` (onboarding + profile edit)
- `TopicCards.jsx` (topic suggestions + quick-search actions)
- `Navbar.jsx` (profile button + auth/logout state)

Research workflow:
- `Hero.jsx` (query input + filters)
- `SearchResults.jsx` (ranked paper cards)
- `InsightModal.jsx` (summary/insights tabs)
- `ResearchGaps.jsx` (gap analysis view)

Landing/supporting sections:
- `KnowledgeSphere`, `MetricsStrip`, `ReadingPlan`, `Features`, `HowItWorks`, `FinalCTA`

---

## 14. Frontend Request Contracts in Use

Search request from UI includes:
- query/filter fields
- personalization fields:
  - `user_interests`
  - `skill_level`
  - `prefer_recent`
  - `goal`

Topics request:
- `interests`, `skill_level`, `goal`

Auth/session localStorage keys:
- `krypton_token`
- `krypton_user`
- `krypton_profile`

---

## 15. Caching + Persistence Strategy

Caching:
- single in-memory TTL cache (`cache_service.py`)

Persistence:
- SQLite as durable store for searches/papers/summaries/insights/gaps/users/profiles

Layering patterns:
- Search: memory -> DB -> live providers
- Summary/Insights: memory -> DB -> Gemini
- Gap analysis: memory -> DB -> Gemini
- Topic suggestion: memory -> Gemini

---

## 16. Developer Runbook

Backend:
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Useful scripts:
- `test_db.py` -> initializes DB and prints created tables
- `test_api.py` -> search -> summary -> insights smoke flow

---

## 17. Notable Mismatches and Risks

1. Search cache/DB identity does not include personalization fields.
- Current cache key + DB lookup for search ignore:
  - `user_interests`, `skill_level`, `prefer_recent`, `goal`
- Effect: personalized requests can be served stale/non-personalized results for identical query filters.

2. `semantic_scholar` naming is legacy.
- Backend route maps this source choice to OpenAlex, not Semantic Scholar.
- Schema still uses `PaperSource.SEMANTIC_SCHOLAR` for OpenAlex-normalized papers.

3. Docs/config drift exists.
- `README.md` and `frontend_api_guide.md` do not fully match current auth/profile/topics endpoints.
- `.env.example` still mentions `gemini-1.5-flash` and does not include JWT settings.

4. Some app metadata comments are stale.
- FastAPI description and some comments still reference removed disk cache.

5. `TopicCards` triggers async fetch during render path.
- It works due to guard flags, but `useEffect` would be a cleaner/react-safe pattern.

---

## 18. Suggested Next Improvements

1. Include personalization fields in search cache key and DB dedupe query.
2. Align source naming (`semantic_scholar` vs `openalex`) in schema/UI/API docs.
3. Update root docs to include auth/profile/topics flow.
4. Add `.env.example` JWT keys (`SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_DAYS`).
5. Move topic auto-fetch in `TopicCards` into `useEffect`.
6. Add automated API tests for auth/profile/search personalization behavior.


# Krypton

Krypton is a full-stack AI research assistant that helps users discover, rank, and understand academic papers faster.

It combines paper search from arXiv and OpenAlex with AI-generated summaries, structured insights, research gap analysis, and personalized topic suggestions.

## Why this project exists

Reading research is slow when discovery, filtering, and comprehension are fragmented across many tools. Krypton brings that workflow into one place:

- Search papers across multiple sources
- Rank them by relevance, recency, and citations
- Generate plain-English summaries and key insights
- Detect open research gaps from result sets
- Personalize search and recommendations using user profiles

## Core features

- Unified search: query arXiv and OpenAlex in one request
- Ranking engine: TF-IDF relevance + recency + citation weighting
- Personalization: user interests, skill level, and goal-aware scoring
- AI summaries: 3-5 sentence summary + key contribution per paper
- AI insights: problem, method, result, limitation extraction
- Research gap analysis: gap clusters + open questions from selected papers
- Topic suggestions: profile-based hot topic cards with ready-to-search queries
- Auth and profiles: signup/login with JWT + persisted personalization
- Caching and persistence: in-memory TTL cache + SQLite-backed history/results

## Tech stack

### Backend
- FastAPI
- SQLAlchemy (async) + SQLite
- Google Gemini (`google-genai`)
- arXiv API
- OpenAlex API
- scikit-learn (TF-IDF + cosine similarity)

### Frontend
- React (Vite)
- Tailwind CSS
- Framer Motion

## Architecture overview

1. User submits search query and filters from the React UI.
2. Backend checks memory cache, then SQLite history for exact query reuse.
3. Backend fetches papers from arXiv and OpenAlex in parallel.
4. arXiv papers are enriched with citation counts via OpenAlex.
5. Ranking service computes relevance/recency/citation (plus interest scoring when available).
6. Results are returned, cached, and stored as searchable history.
7. Optional AI actions (summary, insights, gaps, topic suggestions) call Gemini and persist successful outputs.

## Project structure

```text
Krypton/
├── app/
│   ├── main.py                  # FastAPI app + router wiring
│   ├── config.py                # Settings from .env
│   ├── database.py              # Async SQLite engine/session
│   ├── models/
│   │   ├── schemas.py           # Request/response Pydantic models
│   │   └── db_models.py         # SQLAlchemy ORM tables
│   ├── routers/
│   │   ├── search.py            # /api/search
│   │   ├── papers.py            # /api/papers/*
│   │   ├── gaps.py              # /api/gaps/analyze
│   │   ├── topics.py            # /api/topics/suggest
│   │   ├── auth.py              # /api/auth/*
│   │   ├── user.py              # /api/user/profile
│   │   ├── history.py           # /api/history*
│   │   └── health.py            # /api/health
│   └── services/
│       ├── arxiv_service.py
│       ├── openalex_service.py
│       ├── ranking_service.py
│       ├── ai_service.py
│       ├── gap_service.py
│       ├── topic_service.py
│       ├── auth_service.py
│       ├── db_service.py
│       └── cache_service.py
├── frontend/
│   ├── src/
│   │   ├── api/                 # API client wrappers
│   │   ├── components/          # UI modules (search, gaps, auth, profile)
│   │   └── App.jsx              # Main app flow
│   └── package.json
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## Local setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- npm

### 1) Backend setup

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

SEMANTIC_SCHOLAR_API_KEY=

SECRET_KEY=replace-with-a-strong-random-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_DAYS=7

APP_ENV=development
APP_VERSION=1.0.0

DATABASE_PATH=./research_agent.db
CACHE_TTL_MINUTES=30
MAX_RESULTS_DEFAULT=20
MAX_RESULTS_LIMIT=50

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Start backend:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend URLs:

- API base: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

### 2) Frontend setup

```bash
cd frontend
npm install
```

Optional frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Start frontend:

```bash
npm run dev
```

Frontend URL (default):

- `http://localhost:5173`

## Docker setup

Build and run backend with Docker Compose:

```bash
docker compose up --build
```

The app inside the container defaults to port `8000`, while the current compose file maps `8080:8080`. Use one of these before running:

- Option A: add `PORT=8080` to backend environment in `docker-compose.yml`
- Option B: change port mapping to `8000:8000`

Then access backend at:

- `http://localhost:8000` (if using Option B)
- `http://localhost:8080` (if using Option A)

If you also run frontend locally, set:

```env
VITE_API_BASE_URL=http://localhost:8000   # or :8080 if using Option A
```

## Ranking logic

Base scoring:

- `0.40 * relevance + 0.30 * recency + 0.30 * citation`

Personalized scoring (when user interests are present):

- `0.30 * relevance + 0.25 * recency + 0.20 * citation + 0.25 * interest_match`

If `prefer_recent=true`, recency weight is boosted.


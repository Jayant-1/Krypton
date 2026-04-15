# Krypton — AI Research Assistant
### Complete Application Summary

---

## Overview

**Krypton** is a full-stack AI-powered research assistant that helps users find, rank, and understand academic papers. Users enter a research query; Krypton searches multiple academic databases simultaneously, ranks results with a transparent scoring algorithm, and uses Google Gemini AI to generate plain-English summaries and structured insights.

---

## Architecture

```
Browser (localhost:5173)  ─── React + Vite + Tailwind
         │
         │  HTTP (direct, CORS open)
         ▼
FastAPI Backend (localhost:8000)  ─── Python + SQLite
         │
    ┌────┴────┬───────────┐
    ▼         ▼           ▼
  arXiv    OpenAlex    Gemini AI
  API       API        (Summaries)
         │
    SQLite DB  (research_agent.db)
    searches · papers · summaries · insights
```

---

## Backend — FastAPI (`app/`)

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI + Uvicorn (ASGI) |
| Database | SQLite via SQLAlchemy + aiosqlite |
| AI | Google Gemini 2.5 Flash |
| Academic APIs | arXiv · OpenAlex (free) · Semantic Scholar (optional) |
| Ranking | TF-IDF cosine similarity (scikit-learn) |
| Config | pydantic-settings + `.env` |

### File Structure

```
app/
├── main.py                      ← FastAPI app, CORS, lifespan, router mounting
├── config.py                    ← Settings from .env
├── database.py                  ← SQLAlchemy async engine + init_db()
│
├── models/
│   ├── db_models.py             ← ORM: SearchSession, Paper, Summary, Insights
│   └── schemas.py               ← Pydantic request/response models
│
├── routers/
│   ├── search.py                ← POST /api/search
│   ├── papers.py                ← GET /api/papers/{id}/summary | /insights
│   ├── history.py               ← GET /api/history
│   └── health.py                ← GET /api/health
│
└── services/
    ├── arxiv_service.py         ← arXiv async search
    ├── openalex_service.py      ← OpenAlex search + citation counts
    ├── ai_service.py            ← Gemini API (summary + insights)
    ├── ranking_service.py       ← Scoring algorithm
    ├── db_service.py            ← All SQLite CRUD operations
    └── cache_service.py         ← In-memory TTL cache (30 min)
```

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server status + Gemini config check |
| `POST` | `/api/search` | Search, rank, and persist papers |
| `GET` | `/api/papers/{id}/summary` | AI-generated summary (Gemini) |
| `GET` | `/api/papers/{id}/insights` | Problem / Method / Result / Limitation |
| `GET` | `/api/history` | Browse all past searches from SQLite |
| `DELETE` | `/api/cache` | Clear in-memory cache |

### Ranking Algorithm

```
combined_score = 0.4 × relevance_score
               + 0.3 × recency_score
               + 0.3 × citation_score

relevance_score  = TF-IDF cosine similarity (query ↔ title + abstract)
recency_score    = exponential decay by publication year
citation_score   = log-normalised citation count
```

### Persistence Layer (3-tier)

```
Search Request
  → L1: In-memory TTL cache (30 min hot path)
  → L2: SQLite DB lookup  (get_cached_search)
  → L3: Live API fetch (arXiv + OpenAlex)
           └─ Save results to SQLite + L1 cache
```

---

## Frontend — React (`frontend/`)

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 8 |
| Styling | Tailwind CSS v3 |
| Animations | Framer Motion |
| Fonts | Newsreader · Inter · JetBrains Mono |
| HTTP | Native fetch → `http://localhost:8000` (CORS open) |

### Design System — "The Obsidian Archive"

| Token | Value | Usage |
|---|---|---|
| `k-dark` | `#0B0D0E` | Page background |
| `k-surface` | `#16181A` | Cards, panels |
| `k-border` | `#2A2D30` | All borders |
| `k-cyan` | `#00F5FF` | Primary accent, scores, glow |
| `k-mint` | `#94FBAB` | Secondary, cache badge |
| `k-muted` | `#8A9BAE` | Labels, metadata |

### Component Map

```
App.jsx                ← Root: health check, search state, modal orchestration
│
├── Navbar.jsx          ← Floating glass navbar, scroll-detection
├── Hero.jsx            ← Terminal search bar, filter panel, KnowledgeSphere
│   └── KnowledgeSphere.jsx  ← Animated SVG node graph (pure CSS/SVG)
│
├── MetricsStrip.jsx    ← 4 live metrics with scan-line animation
├── ReadingPlan.jsx     ← 3 premium static paper cards (demo content)
├── Features.jsx        ← 6-tile bento grid with abstract SVG icons
├── HowItWorks.jsx      ← 3-step workflow (StepCard + connector line)
├── FinalCTA.jsx        ← Centered CTA with ambient glow
│
├── SearchResults.jsx   ← Live ranked results: skeleton loaders, score bars,
│   (PaperCard inline)     SUMMARY / INSIGHTS / OPEN buttons
│
└── InsightModal.jsx    ← 2-tab modal: Summary | Insights
    ├── SummaryTab      ← Lazy loads GET /summary on mount
    └── InsightsTab     ← Lazy loads GET /insights on tab click
```

### User Flow

```
1. Page loads → GET /api/health
   ├── OK: footer shows "SYSTEM ONLINE ●"
   ├── Gemini not configured: yellow banner
   └── Backend offline: red banner

2. User types query + optional filters:
   - Domain: all / AI / ML / NLP / CV / Healthcare / Robotics / Security
   - Year From / Year To (1990–2026)
   - Sources: All / arXiv Only / OpenAlex Only

3. Click SEARCH (or Enter)
   └── POST /api/search → loading spinner on button
   └── Results replace static sections (AnimatePresence transition)
   └── Ranked cards show: title, authors, year, REL/REC/CIT score bars

4. Click SUMMARY on a card
   └── Modal opens → GET /api/papers/{id}/summary
   └── "Gemini is thinking…" dots while loading
   └── Summary text + Key Contribution block
   └── ⚡ CACHED badge if served from SQLite

5. Click INSIGHTS tab
   └── GET /api/papers/{id}/insights (lazy, only when tab clicked)
   └── 4 blocks: Problem / Method / Result / Limitation

6. Click OPEN ↗ → opens paper URL (arXiv / DOI)

7. Click ← Back to Explore → results clear, landing page reappears
```

---

## Environment (`.env`)

```env
GEMINI_API_KEY=...           # Required for Summary + Insights
GEMINI_MODEL=gemini-2.5-flash
SEMANTIC_SCHOLAR_API_KEY=    # Optional (falls back to OpenAlex free)
CACHE_TTL_MINUTES=30
MAX_RESULTS_DEFAULT=20
MAX_RESULTS_LIMIT=50
APP_ENV=development           # → CORS open for all origins
```

---

## Running the App

```bash
# Backend (Terminal 1)
cd d:/Projects/hackthon
uvicorn app.main:app --reload
# → http://localhost:8000
# → Swagger docs: http://localhost:8000/docs

# Frontend (Terminal 2)
cd d:/Projects/hackthon/frontend
npm run dev
# → http://localhost:5173
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| SQLite over disk JSON | Structured queries, atomic writes, persistence across restarts |
| L1 cache + L2 DB + L3 live fetch | Hot-path speed without redundant API calls |
| Gemini lazy-loaded per tab | Respects 10 req/min free tier; avoids double-calls |
| Transparent score breakdown | REL / REC / CIT bars — no black-box rankings |
| Direct HTTP URL (no Vite proxy) | Eliminates proxy restart issues; CORS is open in dev |
| AnimatePresence transitions | Clean fade between landing page and results view |
| Framer Motion scroll triggers | All sections entrance-animate via `useInView` |

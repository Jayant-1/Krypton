# Research Assistant AI Agent — Backend

A FastAPI backend that fetches, ranks, summarises, and extracts insights from academic papers using arXiv, Semantic Scholar, and Google Gemini.

---

## Quick Start

### 1. Create virtual environment
```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure API keys
```bash
copy .env.example .env
```
Then edit `.env` and add your `GEMINI_API_KEY`.
> Get a free key at https://aistudio.google.com/app/apikey

### 4. Run the server
```bash
uvicorn app.main:app --reload
```

Server runs at: http://127.0.0.1:8000
Interactive docs: http://127.0.0.1:8000/docs

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/search` | Search + rank papers |
| `GET` | `/api/papers/{id}/summary` | AI summary (cached) |
| `GET` | `/api/papers/{id}/insights` | Structured insights (cached) |
| `GET` | `/api/health` | Health check |

---

## Example: Search Request

```bash
curl -X POST http://127.0.0.1:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "transformer attention mechanism",
    "year_from": 2020,
    "year_to": 2024,
    "domain": "AI",
    "max_results": 10,
    "sources": "both"
  }'
```

## Example: Get Summary

```bash
curl "http://127.0.0.1:8000/api/papers/arxiv_2305.10601/summary?title=Attention+Is+All+You+Need&abstract=We+propose+a+new+simple+network+architecture..."
```

---

## Project Structure

```
hackthon/
├── app/
│   ├── main.py                         # FastAPI entry point
│   ├── config.py                       # Settings from .env
│   ├── models/
│   │   └── schemas.py                  # Pydantic request/response models
│   ├── services/
│   │   ├── arxiv_service.py            # arXiv API integration
│   │   ├── semantic_scholar_service.py # Semantic Scholar API integration
│   │   ├── ranking_service.py          # TF-IDF + recency + citation ranking
│   │   ├── ai_service.py               # Gemini summarization & insights
│   │   └── cache_service.py            # Two-layer TTL cache
│   └── routers/
│       ├── search.py                   # POST /api/search
│       ├── papers.py                   # GET /api/papers/{id}/*
│       └── health.py                   # GET /api/health
├── cache/                              # Auto-created disk cache
├── .env                                # Your API keys (gitignored)
├── .env.example                        # Key template
├── requirements.txt
└── README.md
```

---

## Ranking Algorithm

```
combined_score = 0.4 × relevance + 0.3 × recency + 0.3 × citation_norm

Where:
  relevance     = TF-IDF cosine similarity (query vs title+abstract)
  recency       = linear(year, 1990, 2024)
  citation_norm = log(1 + citations) / log(1 + max_citations)
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | — | Google AI Studio key |
| `SEMANTIC_SCHOLAR_API_KEY` | ❌ No | — | Higher S2 rate limits |
| `CACHE_TTL_MINUTES` | ❌ No | `30` | Cache expiry duration |
| `MAX_RESULTS_DEFAULT` | ❌ No | `20` | Default papers per search |
| `GEMINI_MODEL` | ❌ No | `gemini-1.5-flash` | Gemini model name |
| `APP_ENV` | ❌ No | `development` | `development` or `production` |

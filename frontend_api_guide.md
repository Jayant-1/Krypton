# Frontend API Reference — Research Assistant AI Agent

**Base URL:** `http://127.0.0.1:8000`  
**All responses:** `application/json`  
**CORS:** Open (all origins allowed in dev mode)

---

## 1. Health Check

Use this on app load to check if the backend is running and Gemini is configured.

### Request
```
GET /api/health
```

### Response `200`
```json
{
  "status": "ok",
  "version": "1.0.0",
  "environment": "development",
  "gemini_configured": true,
  "semantic_scholar_configured": false
}
```

### Frontend usage
```js
const res = await fetch("http://127.0.0.1:8000/api/health");
const data = await res.json();
if (!data.gemini_configured) {
  showWarning("AI features unavailable — Gemini key not set");
}
```

---

## 2. Search Papers

Call this when the user clicks the Search button. Returns ranked papers.

### Request
```
POST /api/search
Content-Type: application/json
```

### Request Body
```json
{
  "query": "transformer attention mechanism",
  "year_from": 2020,
  "year_to": 2024,
  "domain": "AI",
  "max_results": 20,
  "sources": "both"
}
```

### Field Reference

| Field | Type | Required | Default | Options |
|-------|------|----------|---------|---------|
| `query` | string | ✅ Yes | — | Any keyword/topic (2–300 chars) |
| `year_from` | int | ❌ No | null | 1990–2026 |
| `year_to` | int | ❌ No | null | 1990–2026 |
| `domain` | string | ❌ No | `"all"` | `"all"` `"AI"` `"ML"` `"NLP"` `"CV"` `"Healthcare"` `"Robotics"` `"Data Science"` `"Security"` |
| `max_results` | int | ❌ No | `20` | 1–50 |
| `sources` | string | ❌ No | `"both"` | `"arxiv"` `"semantic_scholar"` `"both"` |

> ⚠️ `"semantic_scholar"` actually calls **OpenAlex** internally (free, no key needed)

### Response `200`
```json
{
  "query": "transformer attention mechanism",
  "total": 20,
  "cached": false,
  "sources_used": ["arxiv", "openalex"],
  "papers": [
    {
      "id": "arxiv_2305.10601v2",
      "title": "Attention Is All You Need",
      "abstract": "We propose a new simple network architecture...",
      "authors": ["Ashish Vaswani", "Noam Shazeer"],
      "year": 2023,
      "link": "https://arxiv.org/abs/2305.10601",
      "source": "arxiv",
      "doi": null,
      "citation_count": 412,
      "relevance_score": 0.8923,
      "recency_score": 0.9028,
      "citation_score": 0.7541,
      "combined_score": 0.8498
    }
  ]
}
```

### Key fields to display in UI

| Field | Display as |
|-------|-----------|
| `title` | Paper title (clickable) |
| `authors` | Comma-joined author names |
| `year` | Publication year badge |
| `citation_count` | "📚 412 citations" |
| `combined_score` | Relevance bar or score badge |
| `link` | "Open Paper ↗" button |
| `abstract` | Expandable preview (first 200 chars) |
| `id` | Store this — used to call summary/insights |

### Response `404`
```json
{ "detail": "No papers found for the given query and filters. Try broader terms." }
```

### Frontend usage
```js
const res = await fetch("http://127.0.0.1:8000/api/search", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: searchQuery,
    year_from: yearFrom || null,
    year_to: yearTo || null,
    domain: selectedDomain,
    max_results: 20,
    sources: "both"
  })
});
const data = await res.json();
// data.papers is already sorted best-first (highest combined_score)
```

---

## 3. Get AI Summary

Call this **only when user clicks "Summarize"** on a paper card (lazy loading).
Pass the paper's `id`, `title`, and `abstract` from the search response.

### Request
```
GET /api/papers/{paper_id}/summary?title=...&abstract=...
```

### URL Parameters

| Param | Where to get it | Notes |
|-------|----------------|-------|
| `paper_id` | `paper.id` from search response | e.g. `arxiv_2305.10601v2` |
| `title` | `paper.title` from search | URL-encode it |
| `abstract` | `paper.abstract` from search | URL-encode it |

### Response `200`
```json
{
  "paper_id": "arxiv_2305.10601v2",
  "title": "Attention Is All You Need",
  "summary": "This paper introduces the Transformer, a neural network architecture that relies entirely on attention mechanisms. Unlike previous models that used recurrent or convolutional layers, it processes all words simultaneously. The Transformer achieves state-of-the-art results on translation tasks. It is significantly faster to train than prior approaches.",
  "key_contribution": "The introduction of the Transformer architecture, which replaces recurrent networks with self-attention, enabling faster, more parallelisable sequence modelling.",
  "cached": false
}
```

> If `cached: true` — response came from cache instantly (no Gemini call made)

### Frontend usage
```js
const params = new URLSearchParams({
  title: paper.title,
  abstract: paper.abstract
});
const res = await fetch(
  `http://127.0.0.1:8000/api/papers/${paper.id}/summary?${params}`
);
const data = await res.json();
showSummary(data.summary, data.key_contribution);
```

---

## 4. Get Structured Insights

Call this **only when user clicks "Insights"** on a paper card.
Same pattern as summary — uses `id`, `title`, `abstract`.

### Request
```
GET /api/papers/{paper_id}/insights?title=...&abstract=...
```

### Response `200`
```json
{
  "paper_id": "arxiv_2305.10601v2",
  "title": "Attention Is All You Need",
  "problem": "Existing sequence models relied on recurrent architectures which are slow to train and struggle with long-range dependencies.",
  "method": "The authors propose the Transformer, a model based entirely on multi-head self-attention mechanisms without any recurrence or convolution.",
  "result": "The model achieves 28.4 BLEU on English-to-German translation, outperforming all previous models while training significantly faster.",
  "limitation": "The model requires large amounts of training data and compute; its performance on low-resource languages is limited.",
  "cached": false
}
```

### Frontend usage
```js
const params = new URLSearchParams({
  title: paper.title,
  abstract: paper.abstract
});
const res = await fetch(
  `http://127.0.0.1:8000/api/papers/${paper.id}/insights?${params}`
);
const data = await res.json();
showInsights({
  problem: data.problem,
  method: data.method,
  result: data.result,
  limitation: data.limitation
});
```

---

## 5. Cache Management (Optional)

Use these if you get a stale error result from summary or insights.

### Clear all cache
```
DELETE /api/cache
```
```json
{ "message": "All cache cleared successfully." }
```

### Clear insights for one paper
```
DELETE /api/cache/{paper_id}/insights
```

### Clear summary for one paper
```
DELETE /api/cache/{paper_id}/summary
```

---

## Full UI Flow — When to Call What

```
App loads
  └─ GET /api/health           → check backend status

User types query + clicks Search
  └─ POST /api/search          → get ranked paper list
       └─ render paper cards (title, authors, year, score, citations)

User clicks "Summarize" on a card
  └─ GET /api/papers/{id}/summary?title=...&abstract=...
       └─ show summary + key_contribution in expanded panel

User clicks "Insights" on a card
  └─ GET /api/papers/{id}/insights?title=...&abstract=...
       └─ show problem / method / result / limitation in structured view

User clicks "Open Paper"
  └─ window.open(paper.link, "_blank")   → opens arXiv or DOI page

User changes query → repeat from POST /api/search
```

---

## Error Handling

| HTTP Code | Meaning | Frontend action |
|-----------|---------|----------------|
| `200` | Success | Render response |
| `404` | No papers found | Show "Try different keywords" message |
| `422` | Invalid request body | Show form validation error |
| `500` | Server/AI error | Show "Try again in a moment" toast |
| `503` | Gemini key not configured | Show "AI features unavailable" banner |

---

## Notes for Frontend Developer

1. **Papers are already sorted** — `data.papers[0]` is always the best match. No client-side sorting needed.
2. **`abstract` can be long** — truncate to 200 chars for the card preview, pass the full value to summary/insights endpoints.
3. **Rate limiting** — Gemini free tier allows ~10 req/min. Don't call summary+insights simultaneously; call one, wait for response, then call the other.
4. **`cached: true`** in summary/insights means it returned instantly — safe to show a "⚡ Cached" badge.
5. **`sources: "both"`** gives the most papers with the best citation data. Use `"arxiv"` for faster responses.
6. **Domain filter** only needs to be sent if the user explicitly selects one — otherwise omit it (defaults to `"all"`).

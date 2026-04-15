import requests
import json

BASE = "http://127.0.0.1:8000"

# 1. Search
print("=== SEARCH ===")
r = requests.post(f"{BASE}/api/search", json={
    "query": "transformer attention mechanism",
    "max_results": 3,
    "sources": "arxiv"
})
data = r.json()
print(f"Status     : {r.status_code}")
print(f"Total      : {data.get('total')}")
print(f"Cached     : {data.get('cached')}")
print(f"Sources    : {data.get('sources_used')}")
papers = data.get("papers", [])
for p in papers:
    score = p["combined_score"]
    cit   = p["citation_count"]
    title = p["title"][:65]
    print(f"  [{score:.3f}] {title} | citations={cit}")

# 2. Summary (use first paper)
if papers:
    p = papers[0]
    print()
    print("=== SUMMARY ===")
    r2 = requests.get(
        f"{BASE}/api/papers/{p['id']}/summary",
        params={"title": p["title"], "abstract": p["abstract"]}
    )
    s = r2.json()
    print(f"Status     : {r2.status_code}")
    print(f"Summary    : {s.get('summary', '')[:300]}")
    print(f"Contribution: {s.get('key_contribution', '')[:200]}")

    # 3. Insights
    print()
    print("=== INSIGHTS ===")
    r3 = requests.get(
        f"{BASE}/api/papers/{p['id']}/insights",
        params={"title": p["title"], "abstract": p["abstract"]}
    )
    ins = r3.json()
    print(f"Status   : {r3.status_code}")
    print(f"Problem  : {ins.get('problem', '')[:200]}")
    print(f"Method   : {ins.get('method', '')[:200]}")
    print(f"Result   : {ins.get('result', '')[:200]}")
    print(f"Limitation: {ins.get('limitation', '')[:200]}")

# Keyword Research Workflow

## Objective

Find low-difficulty keywords by analyzing SERPs for **weak spots** — low-authority domains (DR < 20) and UGC platforms ranking on page 1. Follows LowFruits methodology.

## Key Concepts

### Weak Spots (LowFruits Parity)

| Icon | Meaning | Description |
|------|---------|-------------|
| 🍏 **Green Fruit** | Low-authority site | Domain with DR < 20 ranking on page 1 |
| 🫐 **Blue Fruit** | UGC/Forum | Reddit, Quora, forums ranking on page 1 |
| ❌ **No Fruit** | Strong domain | Only DA 20+ sites ranking — hard to rank |

### SERP Difficulty (SD) Score

- **SD 1 (Easy):** 3+ weak spots on page 1, or 2+ in top 3
- **SD 2 (Medium):** 1-2 weak spots
- **SD 3 (Hard):** 0 weak spots — all strong domains

### Recommendation

> Aim for keywords with **at least 2 weak spots** and SD Score of 1.

---

## Required Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `seed_keyword` | string | required | Seed keyword to expand |
| `language` | string | `en` | Language code (en/fr/de) |
| `location` | string | `United States` | Location for SERPs |
| `max_keywords` | int | `20` | Max keywords to analyze (5-50) |
| `serp_depth` | int | `10` | Results per keyword (10-30) |
| `dr_threshold` | int | `20` | Domain Rank threshold for "weak" |
| `include_ugc` | bool | `true` | Include UGC as weak spots |
| `include_questions` | bool | `false` | Include Exa question discovery |

---

## API Endpoints Used

| API | Endpoint | Purpose |
|-----|----------|---------|
| DataForSEO | `/dataforseo_labs/google/keyword_suggestions/live` | Expand seed keyword |
| DataForSEO | `/serp/google/organic/live/advanced` | Fetch SERP results |
| DataForSEO | `/backlinks/summary/live` | Domain Rank (0-1000 → 0-100) |
| Exa | `/search` + `/contents` | Question discovery (optional) |

---

## Flow

```
Seed Keyword
    │
    ▼
┌─────────────────────────┐
│ 1. Keyword Expansion    │  DataForSEO keyword_suggestions
│    (expand seed → 20)   │  Filter: search_volume > 50
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ 2. SERP Harvest         │  DataForSEO serp/google/organic
│    (top 10 per keyword) │  Extract: organic results
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ 3. Domain Rank          │  DataForSEO backlinks/summary
│    (DR for each domain) │  Normalize: 0-1000 → 0-100
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ 4. Weak Spot Detection  │  DR < 20 → Green Fruit 🍏
│    (analyze each SERP)  │  UGC → Blue Fruit 🫐
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ 5. Calculate SD Score   │  3+ weak = Easy (1)
│    (1-3 difficulty)     │  1-2 weak = Medium (2)
│                         │  0 weak = Hard (3)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ 6. Optional: Exa        │  Reddit/Quora/Forums
│    Question Discovery   │  Semantic search
└────────────┬────────────┘
             │
             ▼
        JSON Response
```

---

## Output Shape

```json
{
  "request": {
    "seed_keyword": "pediatric dentist austin",
    "location": "United States",
    "language": "en",
    "dr_threshold": 20,
    "include_ugc": true
  },
  "keywords": [
    {
      "keyword": "pediatric dentist austin tx",
      "search_volume": 720,
      "cpc": 8.50,
      "kd": 35,
      "green_fruits": 3,
      "ugc_count": 2,
      "weak_spots_count": 5,
      "serp_difficulty": 1,
      "weak_domains": [
        {
          "domain": "smallblog.com",
          "position": 4,
          "dr": 12,
          "type": "green_fruit",
          "url": "https://smallblog.com/...",
          "title": "Best Pediatric Dentists in Austin"
        },
        {
          "domain": "reddit.com",
          "position": 3,
          "dr": 97,
          "type": "blue_fruit",
          "url": "https://reddit.com/...",
          "title": "r/Austin - Pediatric dentist recommendations"
        }
      ]
    }
  ],
  "questions": [
    {
      "question": "best pediatric dentist in austin for toddlers",
      "url": "https://reddit.com/...",
      "source": "reddit"
    }
  ],
  "diagnostics": {
    "keywords_analyzed": 20,
    "total_domains_seen": 142,
    "weak_domains_found": 35,
    "api_calls": {
      "keyword_expansion": 1,
      "serp_fetches": 20,
      "domain_rank_checks": 142,
      "exa_searches": 0
    },
    "elapsed_ms": 45000
  },
  "generated_at": "2026-06-13T..."
}
```

---

## Cost Estimate

| API | Calls | Cost |
|-----|-------|------|
| DataForSEO (keyword suggestions) | 1 | ~$0.01 |
| DataForSEO (SERP × 20 keywords) | 20 | ~$0.06 |
| DataForSEO (backlinks × 140 domains) | 140 | ~$0.14 |
| Exa (optional, 3 searches) | 3 | ~$0.01 |
| **Total** | **164** | **~$0.22** |

---

## Webhook Registration

### Express Server (server.js)

```javascript
const keywordResearch = require('./handlers/keyword-research');

app.post('/webhook/keyword-research', (req, res) => {
  keywordResearch.handle(req, res).catch((err) => {
    res.status(500).json({ error: String(err), stack: err && err.stack ? err.stack.slice(0, 800) : '' });
  });
});
```

### n8n Workflow

- **Webhook Path:** `keyword-research`
- **Response Mode:** Response Node
- **Allowed Origins:** `*`

---

## Frontend Integration

### Sidebar Navigation

```html
<a class="nav-item" data-tool="keyword-research">
  <span class="icon">&#127793;</span>
  Keyword Research
</a>
```

### Panel Elements

- **Webhook URL input** (`kr-webhook-url`)
- **Seed keyword input** (`kr-seed-keyword`)
- **Location select** (`kr-location`)
- **Language select** (`kr-language`)
- **DR threshold input** (`kr-dr-threshold`)
- **Max keywords input** (`kr-max-keywords`)
- **Include UGC select** (`kr-include-ugc`)
- **Run button** (`kr-run-btn`)
- **Results container** (`kr-result-container`)

---

## Edge Cases

1. **No keywords returned** — DataForSEO expansion returns empty. Fallback: use seed keyword directly.
2. **SERP fetch fails** — Single keyword failure doesn't stop the batch. Returns empty organic for that keyword.
3. **Domain rank unavailable** — If backlinks API fails, domain gets `dr: null`. Not counted as weak unless UGC.
4. **All keywords hard** — If no weak spots found, still returns results with SD 3 for each keyword.
5. **Daily API limit hit** — DataForSEO returns error. Propagate to user with retry message.

---

## Files

| File | Purpose |
|------|---------|
| `webhook-service/handlers/keyword-research.js` | Backend handler |
| `keyword-research-workflow.json` | n8n workflow |
| `on-page-app.html` | Frontend panel |
| `on-page-app.css` | Panel styles |
| `webhook-service/server.js` | Route registration |
| `workflows/keyword-research.md` | This documentation |

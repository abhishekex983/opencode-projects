# On-Page SEO Webhook Service

Self-hosted Node/Express service that replaces the n8n webhooks powering the
on-page SEO tools in `on-page-app.html`. Same request/response shape as the
n8n endpoints — clients only need to swap the URL.

Deployed on **Fly.io** as `abhishek-onpage-webhooks` (region `bom`). The
sister service at `Off Page SEO/webhook-service` follows the same Node
conventions but is deployed separately.

## Endpoints

| Method | Path                                | Replaces n8n workflow                | Status |
|--------|-------------------------------------|---------------------------------------|--------|
| POST   | `/webhook/entity-presence`          | `Entity Presence -- Report Generator` | ported |
| POST   | `/webhook/search-intent`            | `search-intent-workflow`              | ported |
| POST   | `/webhook/salience-brief`           | `salience-brief-workflow`             | ported |
| POST   | `/webhook/salience`                 | `salience-workflow`                   | ported |
| POST   | `/webhook/content-optimizer-outline`| `content-optimizer-workflow` (outline)| ported |
| POST   | `/webhook/content-optimizer-content`| `content-optimizer-workflow` (content)| ported |
| POST   | `/webhook/question-research`        | — (new feature, no n8n predecessor)   | ready  |
| POST   | `/webhook/serp-analysis-search`     | — (new feature, no n8n predecessor)   | ready  |
| POST   | `/webhook/serp-analysis-analyze`    | — (new feature, no n8n predecessor)   | ready  |
| GET    | `/healthz`                          | —                                     | ready  |

All endpoints accept `{ "test": true }` as the body and short-circuit with
`{ ok: true, ... }` so the dashboard's "Test" buttons work without burning API
credits.

## Request / response — entity-presence

Same shape as the n8n `ranking-report` webhook. Request body:

```json
{
  "search_term": "pediatric dentist austin",
  "location": "Austin,Texas,United States",
  "target_business_name": "Sunshine Kids Dentistry",
  "target_website": "https://example.com",
  "competitors": [{ "name": "Sample Dental", "url": "https://example.com" }],
  "neuronwriter_api_key": "",
  "neuronwriter_project_id": ""
}
```

Response (truncated):

```json
{
  "request": { "...": "echo of inputs" },
  "plan": { "...": "Gemini-generated ranking plan, same schema as n8n" },
  "neuronwriter": { "...": "or null if disabled" },
  "competitor_enrichment": { "...": "..." },
  "target_enrichment": { "...": "..." },
  "target_gbp": { "...": "pruned Google Business Profile" },
  "generated_at": "2026-05-23T..."
}
```

## Local run (Windows / dev box)

```powershell
cd "F:\Claude\Projects\SEO suite\On page SEO\webhook-service"
Copy-Item .env.example .env
notepad .env
npm install
npm start
```

Listens on `http://localhost:5679`. Smoke test:

```powershell
$body = @{
  search_term='pediatric dentist austin'
  location='Austin,Texas,United States'
  target_business_name='Sunshine Kids Dentistry'
  target_website=''
  competitors=@()
} | ConvertTo-Json -Depth 4
Invoke-RestMethod -Uri http://localhost:5679/webhook/entity-presence -Method POST -ContentType 'application/json' -Body $body
```

Pipeline timings (typical):
- `entity-presence` end-to-end: 20–60s (Gemini does most of it). With
  NeuronWriter enabled, budget 2–3 min — it analyses asynchronously and the
  handler polls until ready.
- `search-intent`: 15–40s per keyword (parallel up to 25).
- `salience-brief` / `salience`: 30–60s.
- `question-research`: 30–90s (PAA + 4 Exa lanes in parallel + Gemini
  clustering).

## Deploy to Fly.io

App name: `abhishek-onpage-webhooks`. Primary region: `bom` (Mumbai).
Internal port: `8080`. Config is in `fly.toml` + `Dockerfile`.

### First time only

```powershell
# Install flyctl if you haven't:  iwr https://fly.io/install.ps1 -useb | iex
& "$env:USERPROFILE\.fly\bin\flyctl.exe" auth login
```

### Deploy a new build

```powershell
cd "F:\Claude\Projects\SEO suite\On page SEO\webhook-service"
& "$env:USERPROFILE\.fly\bin\flyctl.exe" deploy
```

`fly deploy` builds the Docker image from `Dockerfile`, pushes it, and rolls
the machine. Auto-stop is on (`auto_stop_machines = "stop"` in `fly.toml`)
so the machine sleeps when idle — first request after a cold spell adds
~250ms, negligible vs the 20–90s the handler itself takes.

### Manage secrets

**Important:** Production secrets live in Fly's secrets store, not in the
`[env]` block of `fly.toml`. The `.env` file in this repo is for **local dev
only** and is gitignored.

```powershell
$fly = "$env:USERPROFILE\.fly\bin\flyctl.exe"

# List currently-set secrets (names only — values aren't shown)
& $fly secrets list -a abhishek-onpage-webhooks

# Set or update one
& $fly secrets set EXA_API_KEY=xxx -a abhishek-onpage-webhooks

# Bulk-set from your local .env (parses KEY=value lines)
Get-Content .env | Where-Object { $_ -match '^[A-Z]' } | ForEach-Object {
  & $fly secrets set $_ -a abhishek-onpage-webhooks
}

# Remove one
& $fly secrets unset EXA_API_KEY -a abhishek-onpage-webhooks
```

Setting or unsetting a secret triggers a machine restart automatically.

### Required secrets

| Secret | Used by |
|---|---|
| `GOOGLE_KG_API_KEY` | entity-presence (Knowledge Graph + Geocoding) |
| `GOOGLE_PLACES_API_KEY` | entity-presence |
| `GOOGLE_MAPS_API_KEY` | entity-presence (optional split from KG) |
| `GOOGLE_NLP_API_KEY` | salience-brief, salience |
| `GEMINI_API_KEY` | entity-presence (direct Gemini call) |
| `OPENROUTER_API_KEY` | search-intent, salience-brief, content-optimizer, question-research |
| `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` | entity-presence, search-intent, salience-brief, question-research |
| `NEURONWRITER_API_KEY` | entity-presence (request body override wins) |
| `EXA_API_KEY` | question-research |
| `FIRECRAWL_API_KEY` | serp-analysis-analyze (scrapes competitor pages + your page) |
| `ANTHROPIC_API_KEY` | reserved (not yet used) |

### Logs + diagnostics

```powershell
$fly = "$env:USERPROFILE\.fly\bin\flyctl.exe"

# Live log tail
& $fly logs -a abhishek-onpage-webhooks

# Machine status
& $fly status -a abhishek-onpage-webhooks

# SSH into the machine (useful when debugging cold-start issues)
& $fly ssh console -a abhishek-onpage-webhooks
```

Production URL: `https://abhishek-onpage-webhooks.fly.dev/webhook/<endpoint>`.

The "currently live" mapping per dashboard tool is tracked in
`F:\Claude\Projects\SEO suite\On page SEO\All local webhooks.txt`.

## Parity test vs the live n8n webhook

```powershell
node tools\parity-check.js `
  https://n8n.srv1195841.hstgr.cloud/webhook/ranking-report `
  https://abhishek-onpage-webhooks.fly.dev/webhook/entity-presence
```

POSTs the same payload to both and diffs the response shape. The
LLM-generated `plan`, `generated_at`, and live GBP fields that drift between
calls are excluded — what matters is that every consumer (the dashboard JS)
sees the same keys in the same places.

## Cutover process per endpoint

1. Run parity test until structural shape matches.
2. Manually run the endpoint through the dashboard against the Fly URL and
   confirm the renderer doesn't error.
3. Update `on-page-app.html` — or, more practically, paste the new URL into
   the webhook field in each tool and click Save. The dashboard persists
   per-tool webhook URLs in localStorage.
4. Leave the n8n workflow ACTIVE for ~1 week as a fallback.
5. Deactivate the n8n workflow only after every on-page endpoint is ported
   AND the off-page service has run cleanly for a week.
6. Cancel the n8n subscription only after Marketing Insights is also off.

## Secrets — must rotate

The original n8n workflow JSON files in the parent folder
(`F:\Claude\Projects\SEO suite\On page SEO\*.json`) had several API keys
sitting in plaintext inside Code nodes:

- `GOOGLE_KG_API_KEY` (also used for Geocoding)
- `GOOGLE_PLACES_API_KEY`
- `GEMINI_API_KEY`
- `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD`

Rotate all of them in their respective consoles (Google Cloud + DataForSEO)
once the cutover is complete, and update Fly secrets to match. The off-page
migration found the same issue with its DataForSEO + OpenRouter keys — same
keys, same rotation, knock them out together.

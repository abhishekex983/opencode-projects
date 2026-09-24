# Domain Analysis Tool → self-hosted Activepieces

Replaces the n8n webhook workflow. Same input/output contract, so your off-page SEO
tool only needs its webhook URL swapped.

## 1. Start Activepieces
From this `selfhost/` folder (Docker Desktop running):

```bash
docker compose up -d
docker compose logs -f app      # wait for "Activepieces ... started"
```

Open http://localhost:8080 and create the admin account (first user = owner).

> Running on a server, not your laptop? Set `AP_FRONTEND_URL` in `.env` to that
> machine's URL first (e.g. `http://SERVER_IP:8080`), then `docker compose up -d`.

## 2. Import the flow
1. Left sidebar → **Flows** → **+** → **Import Flow**.
2. Pick **`Domain Analysis Tool (Activepieces).json`** (in your Downloads).
3. Open the imported flow → **Publish** (top right).

The version is pinned to `0.83.0` to match the file exactly, so every step imports
valid (Catch Webhook → Analyse Domains → Return Response) with no reconfiguration.

## 3. Get the webhook URL — use the `/sync` one
On the **Catch Webhook** trigger you'll see a Live URL like:

```
http://localhost:8080/api/v1/webhooks/<FLOW_ID>
```

Your off-page tool needs the **synchronous** variant — append `/sync` so it waits for
the results instead of an instant ack:

```
http://localhost:8080/api/v1/webhooks/<FLOW_ID>/sync
```

Put that `/sync` URL into the off-page SEO tool's webhook field.

## 4. Request / response contract (unchanged from n8n)
POST JSON body:
```json
{
  "myDomain": "yoursite.com",
  "domains": ["adjacent1.com", "adjacent2.com"],
  "countries": [{ "code": 2840, "lang": "en", "name": "United States" }]
}
```
`countries` is optional (defaults to US / location_code 2840).

Response:
```json
{
  "success": true,
  "results": [
    { "domain": "...", "rank": 0, "referringDomains": 0, "backlinks": 0,
      "spamScore": 0, "traffic": {}, "trafficHistory": {},
      "siteSummary": "", "verdict": { "verdict": "...", "relLabel": "...", "reason": "..." },
      "errors": [], "hasBacklinkData": true }
  ]
}
```

## Notes
- **API keys** (DataforSEO + OpenRouter) are embedded in the **Analyse Domains** Code
  step, exactly like the n8n version. To rotate them, edit that step.
- **Runtime**: each domain fires several sequential DataforSEO `/live` calls + an AI
  call. The webhook timeout is set to 900s (15 min) so big batches finish. If a batch
  is very large, send fewer domains per call.
- **CORS**: the response sends `Access-Control-Allow-Origin: *`. Fine for server-side
  callers. If your tool calls from a browser, a preflight `OPTIONS` may need handling —
  tell me if so and I'll add an OPTIONS short-circuit.
- **Why not Activepieces Cloud**: Cloud runs Code steps in a V8 isolate with no
  `fetch`, and caps synchronous webhooks at 30s (Cloudflare). This workflow needs both,
  so self-host is the fit. Default mode here (`UNSANDBOXED`) gives Code real `fetch`.
```

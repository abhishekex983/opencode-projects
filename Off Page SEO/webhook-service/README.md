# Off-Page SEO Webhook Service

Self-hosted Node/Express service that replaces the n8n webhooks the off-page
dashboard depends on. Same request/response shape — the only client change is
the URL.

## Endpoints

| Method | Path                          | Replaces n8n webhook            | Status |
|--------|-------------------------------|----------------------------------|--------|
| POST   | `/webhook/domain-analysis`    | `/webhook/domain-analysis`       | ported |
| POST   | `/webhook/order-tracker`      | `/webhook/order-tracker`         | TODO   |
| POST   | `/webhook/run-backlink-check` | `/webhook/run-backlink-check`    | TODO   |
| GET    | `/healthz`                    | —                                | ready  |

## Local run (Windows / dev box)

```powershell
cd "F:\Claude\Projects\SEO suite\Off Page SEO\webhook-service"
Copy-Item .env.example .env
notepad .env            # paste DATAFORSEO_PASSWORD + OPENROUTER_API_KEY
npm install
npm start               # listens on http://localhost:5678
```

Smoke test:

```powershell
$body = @{ myDomain='shettymarketing.com'; domains=@('example.com'); countries=@(@{ code=2840; lang='en'; name='United States' }) } | ConvertTo-Json -Depth 4
Invoke-RestMethod -Uri http://localhost:5678/webhook/domain-analysis -Method POST -ContentType 'application/json' -Body $body
```

## Deploy on the Hostinger VPS

Assumes Ubuntu/Debian with the n8n container already running behind nginx (or
caddy) on the same domain. The new service runs alongside n8n on its own port
until parity is confirmed.

```bash
# 1. Node 20 (skip if already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Drop code on the box (rsync from your laptop OR git clone — your call)
sudo mkdir -p /opt/offpage-webhooks
sudo chown $USER:$USER /opt/offpage-webhooks
# from this folder on the laptop:
#   rsync -av --exclude node_modules --exclude .env ./ user@vps:/opt/offpage-webhooks/

cd /opt/offpage-webhooks
cp .env.example .env
nano .env             # fill DATAFORSEO_PASSWORD + OPENROUTER_API_KEY, set PORT=5678
npm install --omit=dev

# 3. Run under pm2 so it survives reboots
sudo npm i -g pm2
pm2 start server.js --name offpage-webhooks
pm2 save
pm2 startup            # follow the printed command once, then `pm2 save` again

# 4. Expose via nginx (new location block, same hostname as n8n)
sudo tee /etc/nginx/conf.d/offpage-webhooks.conf >/dev/null <<'NGINX'
# Add INSIDE the existing server { } block that serves n8n.srv1195841.hstgr.cloud
# or create a sibling block on a different subdomain. Easiest: same host, new path.
#
# location /v2/webhook/ {
#     proxy_pass http://127.0.0.1:5678/webhook/;
#     proxy_http_version 1.1;
#     proxy_set_header Host $host;
#     proxy_read_timeout 180s;
# }
NGINX
sudo nginx -t && sudo systemctl reload nginx
```

After this, the new URL is e.g. `https://n8n.srv1195841.hstgr.cloud/v2/webhook/domain-analysis`.
Run the parity test (see below) before changing the dashboard.

## Parity test vs the live n8n webhook

```powershell
node tools\parity-check.js https://n8n.srv1195841.hstgr.cloud/webhook/domain-analysis http://localhost:5678/webhook/domain-analysis
```

The script POSTs the same payload to both, then diffs the JSON (ignoring fields
that are nondeterministic: AI verdict text, fetch time).

## Cutover

1. Run parity test until it passes 3 calls in a row.
2. Update `dashboard.html` `webhookUrl` field default to the new URL.
3. Leave the n8n workflow ACTIVE for ~1 week as a fallback.
4. After all 3 off-page webhooks are migrated and quiet, deactivate the n8n
   workflows (don't delete them yet). Cancel the n8n subscription only after
   on-page + Marketing Insights workflows are also off.

## Secrets

The n8n workflow had `DATAFORSEO` credentials and an `OPENROUTER` key baked
into the Code node. Those keys must be **rotated** as part of this migration —
the n8n workflow JSON is sitting in this repo with the credentials in
plaintext. After migrating, rotate both keys in their respective dashboards
and update the VPS `.env`.

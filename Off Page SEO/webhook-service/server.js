require('dotenv').config();
const express = require('express');

const domainAnalysis = require('./handlers/domain-analysis');
const linkGap        = require('./handlers/link-gap');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '256kb' }));

const allowed = (process.env.ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim());
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowAll = allowed.length === 1 && allowed[0] === '*';
  if (allowAll) res.setHeader('Access-Control-Allow-Origin', '*');
  else if (origin && allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

app.get('/healthz', (_req, res) => res.json({ ok: true }));

app.post('/webhook/domain-analysis', (req, res) => {
  domainAnalysis.handle(req, res).catch((err) => {
    res.status(500).json({ success: false, error: String(err) });
  });
});

app.post('/webhook/link-gap', (req, res) => {
  linkGap.handle(req, res).catch((err) => {
    res.status(500).json({ success: false, error: String(err) });
  });
});

const port = Number(process.env.PORT) || 5678;
app.listen(port, () => {
  console.log(`webhook-service listening on :${port}`);
});

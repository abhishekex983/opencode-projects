require('dotenv').config();
const express = require('express');

const entityPresence = require('./handlers/entity-presence');
const searchIntent = require('./handlers/search-intent');
const salienceBrief = require('./handlers/salience-brief');
const salienceScore = require('./handlers/salience-score');
const contentOptimizer = require('./handlers/content-optimizer');
const questionResearch = require('./handlers/question-research');
const serpAnalysis = require('./handlers/serp-analysis');
const nicheResearch = require('./handlers/niche-research');
const blogPostCreation = require('./handlers/blog-post-creation');
const keywordResearch = require('./handlers/keyword-research');

const app = express();
app.disable('x-powered-by');
// 12MB ceiling: content-optimizer accepts base64-encoded audio recordings.
// Base64 adds ~33% overhead, so 12MB ≈ ~9MB raw audio (roughly 5–8 min of webm voice).
app.use(express.json({ limit: '12mb' }));

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

app.post('/webhook/entity-presence', (req, res) => {
  entityPresence.handle(req, res).catch((err) => {
    res.status(500).json({ error: String(err), stack: err && err.stack ? err.stack.slice(0, 800) : '' });
  });
});

app.post('/webhook/search-intent', (req, res) => {
  searchIntent.handle(req, res).catch((err) => {
    res.status(500).json({ error: String(err), stack: err && err.stack ? err.stack.slice(0, 800) : '' });
  });
});

app.post('/webhook/salience-brief', (req, res) => {
  salienceBrief.handle(req, res).catch((err) => {
    res.status(500).json({ error: String(err), stack: err && err.stack ? err.stack.slice(0, 800) : '' });
  });
});

app.post('/webhook/salience', (req, res) => {
  salienceScore.handle(req, res).catch((err) => {
    res.status(500).json({ error: String(err), stack: err && err.stack ? err.stack.slice(0, 800) : '' });
  });
});

app.post('/webhook/content-optimizer-outline', (req, res) => {
  contentOptimizer.handleOutline(req, res).catch((err) => {
    res.status(500).json({ error: String(err), stack: err && err.stack ? err.stack.slice(0, 800) : '' });
  });
});

app.post('/webhook/content-optimizer-content', (req, res) => {
  contentOptimizer.handleContent(req, res).catch((err) => {
    res.status(500).json({ error: String(err), stack: err && err.stack ? err.stack.slice(0, 800) : '' });
  });
});

app.post('/webhook/question-research', (req, res) => {
  questionResearch.handle(req, res).catch((err) => {
    res.status(500).json({ error: String(err), stack: err && err.stack ? err.stack.slice(0, 800) : '' });
  });
});

app.post('/webhook/serp-analysis-search', (req, res) => {
  serpAnalysis.handleSearch(req, res).catch((err) => {
    res.status(500).json({ error: String(err), stack: err && err.stack ? err.stack.slice(0, 800) : '' });
  });
});

app.post('/webhook/serp-analysis-analyze', (req, res) => {
  serpAnalysis.handleAnalyze(req, res).catch((err) => {
    res.status(500).json({ error: String(err), stack: err && err.stack ? err.stack.slice(0, 800) : '' });
  });
});

app.post('/webhook/niche-research', (req, res) => {
  nicheResearch.handle(req, res).catch((err) => {
    res.status(500).json({ error: String(err), stack: err && err.stack ? err.stack.slice(0, 800) : '' });
  });
});

app.post('/webhook/keyword-research', (req, res) => {
  keywordResearch.handle(req, res).catch((err) => {
    res.status(500).json({ error: String(err), stack: err && err.stack ? err.stack.slice(0, 800) : '' });
  });
});

app.post('/webhook/blog-post-outline', (req, res) => {
  blogPostCreation.handleOutline(req, res).catch((err) => {
    res.status(500).json({ error: String(err), stack: err && err.stack ? err.stack.slice(0, 800) : '' });
  });
});

app.post('/webhook/blog-post-content', (req, res) => {
  blogPostCreation.handleContent(req, res).catch((err) => {
    res.status(500).json({ error: String(err), stack: err && err.stack ? err.stack.slice(0, 800) : '' });
  });
});

app.post('/webhook/blog-post-tldr', (req, res) => {
  blogPostCreation.handleTldr(req, res).catch((err) => {
    res.status(500).json({ error: String(err), stack: err && err.stack ? err.stack.slice(0, 800) : '' });
  });
});

const port = Number(process.env.PORT) || 5679;
app.listen(port, () => {
  console.log(`on-page webhook-service listening on :${port}`);
});

// Thin wrapper around Exa's neural search + contents endpoints.
//
// Exa is a semantic search engine — it embeds the query and ranks pages by
// vector similarity, not keyword match. We use it to surface community
// discussions (Reddit, Quora, forums, YouTube) that are semantically about
// the user's keyword even when they don't contain the literal phrase.
//
// Docs: https://docs.exa.ai/reference/search   /contents

const { requestJson } = require('./http');

const API_BASE = 'https://api.exa.ai';

function exaKey() {
  const k = process.env.EXA_API_KEY;
  if (!k) throw new Error('EXA_API_KEY missing from environment');
  return k;
}

// search() — neural semantic search.
//
// opts:
//   query              — string (the user's keyword, optionally augmented)
//   numResults         — int, default 15 (Exa caps at 100; we keep it modest)
//   includeDomains     — string[] — restrict to these domains
//   excludeDomains     — string[] — drop these domains
//   category           — Exa category hint (e.g. "social media", "company")
//   startPublishedDate — ISO date string; ignore older content
//   timeoutMs          — default 30s
async function search({ query, numResults = 15, includeDomains, excludeDomains, category, startPublishedDate, timeoutMs = 30000 }) {
  const body = {
    query,
    numResults,
    type: 'neural',
    useAutoprompt: true,
  };
  if (includeDomains && includeDomains.length) body.includeDomains = includeDomains;
  if (excludeDomains && excludeDomains.length) body.excludeDomains = excludeDomains;
  if (category) body.category = category;
  if (startPublishedDate) body.startPublishedDate = startPublishedDate;

  return requestJson({
    method: 'POST',
    url: API_BASE + '/search',
    headers: {
      'x-api-key': exaKey(),
      'Content-Type': 'application/json',
    },
    body,
    timeoutMs,
  });
}

// getContents() — pulls cleaned page text for a batch of Exa result IDs.
// `text` returns the cleaned article body; `highlights` returns the top
// passages relative to the original query (cheaper, more focused). We
// request both so the handler can choose per-source.
async function getContents({ ids, query, timeoutMs = 30000 }) {
  if (!Array.isArray(ids) || ids.length === 0) return { results: [] };
  const body = {
    ids,
    text: { maxCharacters: 4000, includeHtmlTags: false },
    highlights: { numSentences: 3, highlightsPerUrl: 3, query },
  };
  return requestJson({
    method: 'POST',
    url: API_BASE + '/contents',
    headers: {
      'x-api-key': exaKey(),
      'Content-Type': 'application/json',
    },
    body,
    timeoutMs,
  });
}

// One-shot helper: search + fetch contents in a single round-trip equivalent.
// Returns { results: [{ id, url, title, score, publishedDate, text, highlights, source }] }
// where `source` is the label passed in (e.g. "reddit") so the handler can
// preserve provenance when it merges multiple searches.
async function searchAndContents(opts) {
  const sourceLabel = opts.source || '';
  const search1 = await search(opts);
  if (!search1 || search1._error || !Array.isArray(search1.results)) {
    return { results: [], error: (search1 && search1._error) || 'Exa search returned no results array', raw: search1 };
  }
  const baseResults = search1.results.slice(0, opts.numResults || 15);
  if (baseResults.length === 0) return { results: [] };

  const ids = baseResults.map((r) => r.id).filter(Boolean);
  const contents = await getContents({ ids, query: opts.query, timeoutMs: opts.timeoutMs });

  const textById = new Map();
  const highlightsById = new Map();
  if (contents && Array.isArray(contents.results)) {
    for (const c of contents.results) {
      if (c.id) {
        if (c.text) textById.set(c.id, c.text);
        if (Array.isArray(c.highlights)) highlightsById.set(c.id, c.highlights);
      }
    }
  }

  const merged = baseResults.map((r) => ({
    id: r.id,
    url: r.url,
    title: r.title,
    score: r.score,
    publishedDate: r.publishedDate,
    author: r.author,
    source: sourceLabel,
    text: textById.get(r.id) || '',
    highlights: highlightsById.get(r.id) || [],
  }));

  return { results: merged };
}

module.exports = { search, getContents, searchAndContents };

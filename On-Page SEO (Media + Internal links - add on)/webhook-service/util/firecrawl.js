// Firecrawl client — wraps /v1/scrape so handlers can fetch rendered page
// content (markdown + html + links + metadata) without dealing with auth or
// timeouts. Used by serp-analysis to compare a target page against the top
// SERP competitors. Falls back to a raw-HTML fetch if Firecrawl errors out so
// a single bad page does not nuke a whole analysis run.

const { requestJson, requestText } = require('./http');

const API_BASE = 'https://api.firecrawl.dev/v1';

function fcKey() {
  const k = process.env.FIRECRAWL_API_KEY;
  if (!k) throw new Error('FIRECRAWL_API_KEY missing from environment');
  return k;
}

const FALLBACK_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; ShettyMarketingSerpBot/1.0; +https://shettymarketing.com)',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};

// One scrape. Returns { source: 'firecrawl'|'fallback', markdown, html, links, metadata, error? }.
// onlyMainContent defaults to true (content analysis). For signal detection
// (ad networks, affiliate tags, CMS fingerprints) pass onlyMainContent:false
// so scripts and footer scripts/links survive in the html payload.
// blockAds defaults to true; signal detection should pass blockAds:false so
// adsense/mediavine/ezoic script tags are still present in the rendered html.
async function scrape(url, {
  timeoutMs = 60000,
  includeHtml = true,
  onlyMainContent = true,
  blockAds = true,
  waitFor = 1500,
} = {}) {
  const formats = includeHtml ? ['markdown', 'html', 'links'] : ['markdown', 'links'];

  const resp = await requestJson({
    method: 'POST',
    url: API_BASE + '/scrape',
    headers: {
      Authorization: 'Bearer ' + fcKey(),
      'Content-Type': 'application/json',
    },
    body: {
      url,
      formats,
      onlyMainContent,
      blockAds,
      waitFor,
    },
    timeoutMs,
  });

  if (resp && resp._error) {
    return fallbackScrape(url, { reason: 'firecrawl transport error: ' + resp._error });
  }
  if (resp && resp.success === false) {
    const msg = resp.error || resp.message || 'firecrawl returned success=false';
    return fallbackScrape(url, { reason: 'firecrawl error: ' + msg });
  }

  const data = resp && resp.data ? resp.data : {};
  return {
    source: 'firecrawl',
    markdown: String(data.markdown || ''),
    html: String(data.html || ''),
    links: Array.isArray(data.links) ? data.links : [],
    metadata: data.metadata || {},
  };
}

// When Firecrawl fails (rate-limit, blocked URL, timeout, missing key), pull
// raw HTML directly so the analysis still has *something* to work with for
// that page. Quality is lower (no rendered JS, no clean main-content
// extraction) but it beats dropping the page entirely.
async function fallbackScrape(url, { reason }) {
  const html = await requestText({ method: 'GET', url, headers: FALLBACK_HEADERS, timeoutMs: 15000 });
  if (!html) {
    return { source: 'fallback', markdown: '', html: '', links: [], metadata: {}, error: reason + ' (fallback fetch also failed)' };
  }
  return {
    source: 'fallback',
    markdown: '',
    html,
    links: [],
    metadata: {},
    error: reason,
  };
}

module.exports = { scrape };

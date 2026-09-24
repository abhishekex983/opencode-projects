// Niche Research handler — finds low-DA, high-traffic sites in a niche so the
// user can size up weak competitors before committing to a niche.
//
//   POST /webhook/niche-research
//     Input:  { niche, language?, location?, filters?, seed_keywords?,
//               max_keywords?, serp_depth?, max_domains? }
//     Output: { request, total_weak_websites, domains[], costs, generated_at }
//
// Flow: keyword expansion (or user-provided list) → parallel SERP harvest →
// dedupe domain set → DataForSEO domain_rank_overview (DR + traffic) →
// pre-filter on DA/Traffic → Firecrawl scrape (full-page, ads on) → signal
// detection (ad networks, affiliate, CMS, ecommerce) → monetization filter →
// score by Perf = traffic / (DA+1). LowFruits parity: returns the same column
// set (domain, signals, main_topic, niche, perf, da, global_traf, us_traf).

const { dfsPost } = require('../util/dataforseo');
const { scrape } = require('../util/firecrawl');

const LANGUAGES = ['en', 'fr', 'de'];
const DEFAULT_MAX_KEYWORDS = 30;
const DEFAULT_SERP_DEPTH = 20;
const DEFAULT_MAX_DOMAINS = 40;
const SCRAPE_CONCURRENCY = 5;
const SERP_CONCURRENCY = 5;
const ENRICH_CONCURRENCY = 8;

// Domains we never want as "weak competitors" — they're aggregators, news
// giants, social platforms, or marketplaces, not niche sites you'd outrank.
const DOMAIN_BLOCKLIST = new Set([
  'youtube.com', 'facebook.com', 'instagram.com', 'twitter.com', 'x.com',
  'tiktok.com', 'pinterest.com', 'reddit.com', 'quora.com', 'medium.com',
  'linkedin.com', 'wikipedia.org', 'amazon.com', 'amazon.co.uk', 'amazon.ca',
  'ebay.com', 'etsy.com', 'walmart.com', 'target.com', 'homedepot.com',
  'lowes.com', 'wayfair.com', 'ikea.com', 'apple.com', 'microsoft.com',
  'google.com', 'yahoo.com', 'bing.com', 'forbes.com', 'nytimes.com',
  'washingtonpost.com', 'cnn.com', 'bbc.com', 'theguardian.com', 'huffpost.com',
  'businessinsider.com', 'buzzfeed.com', 'vox.com', 'thespruce.com',
  'thespruceeats.com', 'thespucehome.com', 'hgtv.com', 'bobvila.com',
  'familyhandyman.com', 'goodhousekeeping.com', 'housebeautiful.com',
  'architecturaldigest.com', 'elledecor.com', 'realsimple.com',
  'bhg.com', 'countryliving.com', 'marthastewart.com', 'thisoldhouse.com',
  'amazon.in', 'amazon.de', 'amazon.fr',
]);

function getBody(rawBody) {
  return (rawBody && typeof rawBody.body === 'object' && rawBody.body !== null) ? rawBody.body : (rawBody || {});
}

function isTestPing(rawBody) {
  return rawBody.test === true || (rawBody.body && rawBody.body.test === true);
}

function clampInt(v, lo, hi, def) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function normalizeInput(rawBody) {
  const body = getBody(rawBody);
  const filters = body.filters && typeof body.filters === 'object' ? body.filters : {};
  const language = LANGUAGES.includes(body.language) ? body.language : 'en';
  const seed = Array.isArray(body.seed_keywords)
    ? body.seed_keywords.map((k) => String(k).trim().toLowerCase()).filter(Boolean).slice(0, 60)
    : [];

  const monetization = Array.isArray(filters.monetization) ? filters.monetization.map(String) : [];
  const adNetworks = Array.isArray(filters.ad_networks) ? filters.ad_networks.map(String) : [];

  return {
    niche: String(body.niche || '').trim(),
    language,
    location: String(body.location || 'United States').trim(),
    filters: {
      da_max: clampInt(filters.da_max, 0, 100, 25),
      traffic_min: Math.max(0, Number(filters.traffic_min) || 1000),
      monetization,
      ad_networks: adNetworks,
      pages_min: filters.pages_min != null ? Math.max(0, Number(filters.pages_min)) : null,
      pages_max: filters.pages_max != null ? Math.max(0, Number(filters.pages_max)) : null,
      age_min_years: filters.age_min_years != null ? Math.max(0, Number(filters.age_min_years)) : null,
      age_max_years: filters.age_max_years != null ? Math.max(0, Number(filters.age_max_years)) : null,
    },
    seed_keywords: seed,
    max_keywords: clampInt(body.max_keywords, 5, 60, DEFAULT_MAX_KEYWORDS),
    serp_depth: clampInt(body.serp_depth, 10, 30, DEFAULT_SERP_DEPTH),
    max_domains: clampInt(body.max_domains, 5, 80, DEFAULT_MAX_DOMAINS),
    requested_at: body.requested_at || new Date().toISOString(),
  };
}

// ---------- concurrency helper ----------

async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let i = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      try { results[idx] = await worker(items[idx], idx); }
      catch (e) { results[idx] = { _error: String(e && e.message || e) }; }
    }
  });
  await Promise.all(runners);
  return results;
}

// ---------- step 1: keyword expansion ----------

async function getNicheKeywords(inputs) {
  if (inputs.seed_keywords.length) {
    return inputs.seed_keywords.slice(0, inputs.max_keywords).map((kw) => ({ keyword: kw, source: 'user' }));
  }

  const resp = await dfsPost('/dataforseo_labs/google/keyword_suggestions/live', [{
    keyword: inputs.niche,
    location_name: inputs.location,
    language_code: inputs.language,
    limit: inputs.max_keywords * 2,
    include_seed_keyword: true,
    filters: [['keyword_info.search_volume', '>', 100]],
    order_by: ['keyword_info.search_volume,desc'],
  }], { timeoutMs: 60000 });

  const items = (resp && resp.tasks && resp.tasks[0] && resp.tasks[0].result && resp.tasks[0].result[0] && resp.tasks[0].result[0].items) || [];
  const out = items
    .map((i) => ({
      keyword: String(i.keyword || '').trim().toLowerCase(),
      search_volume: i.keyword_info && i.keyword_info.search_volume,
      cpc: i.keyword_info && i.keyword_info.cpc,
      kd: i.keyword_properties && i.keyword_properties.keyword_difficulty,
    }))
    .filter((k) => k.keyword)
    .slice(0, inputs.max_keywords);
  return out.length ? out : [{ keyword: inputs.niche, source: 'fallback' }];
}

// ---------- step 2: SERP harvest → domain set ----------

async function serpForKeyword(keyword, inputs) {
  const resp = await dfsPost('/serp/google/organic/live/advanced', [{
    keyword,
    location_name: inputs.location,
    language_code: inputs.language,
    device: 'desktop',
    depth: inputs.serp_depth,
  }], { timeoutMs: 60000 });
  const items = (resp && resp.tasks && resp.tasks[0] && resp.tasks[0].result && resp.tasks[0].result[0] && resp.tasks[0].result[0].items) || [];
  return items
    .filter((i) => i.type === 'organic')
    .map((i) => ({ domain: String(i.domain || '').replace(/^www\./, ''), position: i.rank_absolute, url: i.url }));
}

async function gatherDomains(keywordObjs, inputs) {
  const domainMap = new Map();
  await runWithConcurrency(keywordObjs, SERP_CONCURRENCY, async (kwObj) => {
    let results = [];
    try { results = await serpForKeyword(kwObj.keyword, inputs); }
    catch { return; }
    for (const r of results) {
      if (!r.domain || DOMAIN_BLOCKLIST.has(r.domain)) continue;
      if (!domainMap.has(r.domain)) domainMap.set(r.domain, { domain: r.domain, niche_keywords: [] });
      domainMap.get(r.domain).niche_keywords.push({
        keyword: kwObj.keyword,
        position: r.position,
        url: r.url,
        search_volume: kwObj.search_volume || null,
      });
    }
  });
  return [...domainMap.values()];
}

// ---------- step 3: domain enrichment (DR + traffic) ----------

async function enrichDomain(domainObj, inputs) {
  const resp = await dfsPost('/dataforseo_labs/google/domain_rank_overview/live', [{
    target: domainObj.domain,
    location_name: inputs.location,
    language_code: inputs.language,
  }], { timeoutMs: 45000 });

  const result = resp && resp.tasks && resp.tasks[0] && resp.tasks[0].result && resp.tasks[0].result[0];
  const metrics = (result && result.metrics) || {};
  const organic = metrics.organic || {};
  return {
    ...domainObj,
    da: typeof organic.pos_1 === 'number' && typeof metrics.rank === 'number'
      ? metrics.rank
      : (typeof result?.domain_rank === 'number' ? result.domain_rank : null),
    global_traffic: Math.round(Number(organic.etv || 0)),
    ranking_keywords_total: Number(organic.count || 0),
  };
}

async function enrichDomains(domainObjs, inputs) {
  return runWithConcurrency(domainObjs, ENRICH_CONCURRENCY, async (d) => {
    try { return await enrichDomain(d, inputs); }
    catch { return { ...d, da: null, global_traffic: 0, ranking_keywords_total: 0, _enrich_error: true }; }
  });
}

// ---------- step 4: Firecrawl signal detection ----------

// Per-source detection: each entry returns a string tag if detected on the page.
const SIGNAL_RULES = [
  { tag: 'adsense',    test: (h) => /pagead2\.googlesyndication\.com|data-ad-client=["']ca-pub-|adsbygoogle\.js/i.test(h) },
  { tag: 'mediavine',  test: (h) => /scripts\.mediavine\.com|mediavine-/i.test(h) },
  { tag: 'ezoic',      test: (h) => /ezoic\.(com|net)|ezoic\.js/i.test(h) },
  { tag: 'amazon',     test: (h) => /amzn\.to|amazon\.[a-z.]{2,6}\/[^"'<>\s]*[?&]tag=|associates-amazon|as\.li\//i.test(h) },
  { tag: 'affiliate',  test: (h) => /as an amazon associate|affiliate (link|disclosure)|affiliate-disclos|"affiliate"|impact\.com|clickbank|cj\.com|shareasale|awin\.com|partnerstack|rakutenadvertising/i.test(h) },
  { tag: 'shop',       test: (h) => /woocommerce|shopify|\/shop\/|\/store\/|add to cart|\.add-to-cart|product-add-to-cart/i.test(h) },
  { tag: 'wordpress',  test: (h) => /wp-content|wp-includes|wp-json|generator["'\s]+content=["']WordPress/i.test(h) },
  { tag: 'shopify',    test: (h) => /cdn\.shopify\.com|shopify\.com\/s\//i.test(h) },
  { tag: 'ezoic-ads',  test: (h) => /ezojs\.com|ezoic-id/i.test(h) },
];

const AD_NETWORK_TAGS = new Set(['adsense', 'mediavine', 'ezoic', 'ezoic-ads']);

function detectSignals(html) {
  if (!html) return [];
  const seen = [];
  for (const r of SIGNAL_RULES) {
    if (r.test(html)) seen.push(r.tag);
  }
  // dedupe + collapse ezoic-ads under ezoic
  const set = new Set(seen);
  if (set.has('ezoic-ads')) { set.delete('ezoic-ads'); set.add('ezoic'); }
  return [...set];
}

async function scrapeForSignals(domainObj) {
  const url = 'https://' + domainObj.domain;
  try {
    const scraped = await scrape(url, {
      timeoutMs: 45000,
      onlyMainContent: false,
      blockAds: false,
      waitFor: 1200,
    });
    const signals = detectSignals(scraped.html || scraped.markdown || '');
    return { ...domainObj, signals, scrape_source: scraped.source, scrape_error: scraped.error || null };
  } catch (e) {
    return { ...domainObj, signals: [], scrape_source: 'fallback', scrape_error: String(e && e.message || e) };
  }
}

async function detectSignalsForAll(domainObjs) {
  return runWithConcurrency(domainObjs, SCRAPE_CONCURRENCY, scrapeForSignals);
}

// ---------- step 5: filters + scoring ----------

function passesMonetizationFilter(signals, monetizationFilter) {
  if (!monetizationFilter.length) return true;

  const has = (t) => signals.includes(t);
  const hasAds = has('adsense') || has('mediavine') || has('ezoic');
  const hasEcom = has('shop') || has('shopify');
  const hasAffiliate = has('amazon') || has('affiliate');

  for (const want of monetizationFilter) {
    switch (want) {
      case 'monetized_with_ads': if (hasAds) return true; break;
      case 'not_monetized_with_ads': if (!hasAds) return true; break;
      case 'ecommerce': if (hasEcom) return true; break;
      case 'not_ecommerce': if (!hasEcom) return true; break;
      case 'affiliate': if (hasAffiliate) return true; break;
      case 'no_monetization': if (!hasAds && !hasEcom && !hasAffiliate) return true; break;
      default: break;
    }
  }
  return false;
}

function passesAdNetworkFilter(signals, adNetworkFilter) {
  if (!adNetworkFilter.length) return true;
  const present = signals.filter((s) => AD_NETWORK_TAGS.has(s));
  return adNetworkFilter.some((n) => present.includes(n));
}

function scorePerf(traffic, da) {
  if (!traffic || traffic < 1) return 0;
  const safeDa = typeof da === 'number' ? da : 50;
  return Math.round(traffic / (safeDa + 1));
}

// ---------- main handler ----------

async function handle(req, res) {
  const rawBody = req.body || {};

  if (isTestPing(rawBody)) {
    return res.json({ ok: true, message: 'Niche Research webhook reachable', received_at: new Date().toISOString() });
  }

  const inputs = normalizeInput(rawBody);
  if (!inputs.niche && !inputs.seed_keywords.length) {
    return res.status(400).json({ error: 'niche or seed_keywords is required' });
  }

  const t0 = Date.now();

  const keywordObjs = await getNicheKeywords(inputs);
  if (!keywordObjs.length) {
    return res.json({
      request: inputs, total_weak_websites: 0, domains: [],
      diagnostics: { keywords_found: 0, raw_domains: 0, after_pre_filter: 0 },
      generated_at: new Date().toISOString(),
    });
  }

  const rawDomains = await gatherDomains(keywordObjs, inputs);
  const enriched = await enrichDomains(rawDomains, inputs);

  // Pre-filter on DA + traffic BEFORE scraping (Firecrawl is the most
  // expensive step per-row; skipping rows that can't pass DA/Traffic
  // saves real money).
  const preFiltered = enriched
    .filter((d) => (d.da == null || d.da <= inputs.filters.da_max))
    .filter((d) => d.global_traffic >= inputs.filters.traffic_min)
    .sort((a, b) => scorePerf(b.global_traffic, b.da) - scorePerf(a.global_traffic, a.da))
    .slice(0, inputs.max_domains);

  const withSignals = preFiltered.length ? await detectSignalsForAll(preFiltered) : [];

  const finalRows = withSignals
    .filter((d) => passesMonetizationFilter(d.signals, inputs.filters.monetization))
    .filter((d) => passesAdNetworkFilter(d.signals, inputs.filters.ad_networks))
    .map((d) => ({
      domain: d.domain,
      url: 'https://' + d.domain,
      signals: d.signals,
      main_topic: inputs.niche,
      niche: inputs.niche,
      perf: scorePerf(d.global_traffic, d.da),
      da: d.da,
      global_traffic: d.global_traffic,
      us_traffic: null,
      pages_count: null,
      ranking_keywords_total: d.ranking_keywords_total,
      ranking_keywords_in_niche: d.niche_keywords.length,
      top_niche_keywords: d.niche_keywords
        .slice()
        .sort((a, b) => (a.position || 999) - (b.position || 999))
        .slice(0, 8),
      scrape_source: d.scrape_source,
      scrape_error: d.scrape_error,
    }))
    .sort((a, b) => b.perf - a.perf);

  return res.json({
    request: inputs,
    total_weak_websites: finalRows.length,
    domains: finalRows,
    diagnostics: {
      keywords_used: keywordObjs.length,
      raw_domains_seen: rawDomains.length,
      after_pre_filter: preFiltered.length,
      after_signal_filter: finalRows.length,
      elapsed_ms: Date.now() - t0,
    },
    keywords: keywordObjs,
    generated_at: new Date().toISOString(),
  });
}

module.exports = { handle };

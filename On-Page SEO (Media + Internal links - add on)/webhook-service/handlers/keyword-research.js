// Keyword Research handler — finds low-difficulty keywords by analyzing SERPs
// for weak spots (low-authority domains and UGC content), following LowFruits'
// methodology.
//
//   POST /webhook/keyword-research
//     Input:  { seed_keyword, language?, location?, max_keywords?,
//               serp_depth?, dr_threshold?, include_ugc?, include_questions? }
//     Output: { request, keywords[], diagnostics, generated_at }
//
// Flow:
//   1. DataForSEO keyword_suggestions → expand seed into related keywords
//   2. DataForSEO serp/google/organic/live/advanced → fetch top 10 for each keyword
//   3. DataForSEO backlinks/summary → Domain Rank for each unique domain (0-1000 → 0-100)
//   4. UGC detection (Reddit, Quora, forums, etc.)
//   5. Weak spots calculation: green fruits (DR < 20), blue fruits (UGC), SD score (1-3)
//   6. Optional: Exa semantic search for long-tail questions
//
// LowFruits parity:
//   - Green Fruit = low-authority site (DR < 20) ranking on page 1
//   - Blue Fruit = UGC/Forum ranking on page 1
//   - Weak Spots = green_fruits + ugc_count
//   - SERP Difficulty (SD): 1 = easy (3+ weak spots), 2 = medium (1-2), 3 = hard (0)

const { dfsPost } = require('../util/dataforseo');
const exa = require('../util/exa');
const { chat, parseChatJson } = require('../util/openrouter');

const LANGUAGES = ['en', 'fr', 'de'];
const DEFAULT_MAX_KEYWORDS = 20;
const DEFAULT_SERP_DEPTH = 10;
const DEFAULT_DR_THRESHOLD = 20;
const SERP_CONCURRENCY = 5;
const DR_CONCURRENCY = 8;

// UGC platforms — these are "blue fruits" in LowFruits terminology.
// After Google HCU (Sept 2023), forums are strong but still beatable.
const UGC_DOMAINS = new Set([
  'reddit.com', 'quora.com',
  'stackoverflow.com', 'stackexchange.com', 'superuser.com', 'serverfault.com',
  'askubuntu.com', 'mathoverflow.net', 'unix.stackexchange.com',
  'github.com',  // discussions/issues
  'discourse.org',  // forum platform
  'forum.', 'community.',  // generic forum subdomains
  'answers.com', 'answer.', 'answers.',
  'harvard.edu', 'edu',  // academic Q&A
  'coursera.org', 'udemy.com',  // course discussions
  'trustpilot.com', 'glassdoor.com',  // review sites
  'yelp.com', 'tripadvisor.com',  // review sites
  'medium.com',  // publishing platform
  'substack.com',  // newsletter platform
  'ghost.io',  // publishing platform
  'blogspot.com', 'wordpress.com', 'tumblr.com',  // free blog platforms
  'wix.com', 'squarespace.com',  // website builders
]);

// High-authority domains we exclude from weak spot analysis (news, aggregators)
const HIGH_AUTHORITY_BLOCKLIST = new Set([
  'youtube.com', 'facebook.com', 'instagram.com', 'twitter.com', 'x.com',
  'tiktok.com', 'pinterest.com', 'linkedin.com', 'wikipedia.org',
  'amazon.com', 'amazon.co.uk', 'amazon.ca', 'amazon.in', 'amazon.de', 'amazon.fr',
  'ebay.com', 'etsy.com', 'walmart.com', 'target.com',
  'apple.com', 'microsoft.com', 'google.com', 'yahoo.com', 'bing.com',
  'forbes.com', 'nytimes.com', 'washingtonpost.com', 'cnn.com', 'bbc.com',
  'theguardian.com', 'huffpost.com', 'businessinsider.com', 'buzzfeed.com',
  'vox.com', 'reuters.com', 'apnews.com', 'bloomberg.com',
  'webmd.com', 'healthline.com', 'medicalnewstoday.com',
  'mayoclinic.org', 'clevelandclinic.org', 'health.harvard.edu',
]);

// ---------- input normalization ----------

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
  const language = LANGUAGES.includes(body.language) ? body.language : 'en';

  return {
    seed_keyword: String(body.seed_keyword || body.keyword || '').trim(),
    language,
    location: String(body.location || 'United States').trim(),
    max_keywords: clampInt(body.max_keywords, 5, 50, DEFAULT_MAX_KEYWORDS),
    serp_depth: clampInt(body.serp_depth, 10, 30, DEFAULT_SERP_DEPTH),
    dr_threshold: clampInt(body.dr_threshold, 5, 50, DEFAULT_DR_THRESHOLD),
    include_ugc: body.include_ugc !== false,  // default true
    include_questions: body.include_questions === true,  // default false (costs Exa credits)
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

// ---------- keyword expansion (parallel layers) ----------

// Layer 1: DataForSEO keyword_suggestions (no filter, maximum discovery)
async function fetchKeywordSuggestions(seed, inputs) {
  try {
    const resp = await dfsPost('/dataforseo_labs/google/keyword_suggestions/live', [{
      keyword: seed,
      location_name: inputs.location,
      language_code: inputs.language,
      limit: 100,
      include_seed_keyword: true,
      order_by: ['keyword_info.search_volume,desc'],
    }], { timeoutMs: 60000 });

    const items = (resp && resp.tasks && resp.tasks[0] && resp.tasks[0].result &&
      resp.tasks[0].result[0] && resp.tasks[0].result[0].items) || [];

    return items
      .map((i) => ({
        keyword: String(i.keyword || '').trim().toLowerCase(),
        search_volume: i.keyword_info && i.keyword_info.search_volume,
        cpc: i.keyword_info && i.keyword_info.cpc,
        kd: i.keyword_properties && i.keyword_properties.keyword_difficulty,
        source: 'keyword_suggestions',
      }))
      .filter((k) => k.keyword);
  } catch (e) {
    return [];
  }
}

// Layer 2: DataForSEO keyword_ideas (broader semantic matching)
async function fetchKeywordIdeas(seed, inputs) {
  try {
    const resp = await dfsPost('/dataforseo_labs/google/keyword_ideas/live', [{
      keyword: seed,
      location_name: inputs.location,
      language_code: inputs.language,
      limit: 50,
      include_seed_keyword: false,
    }], { timeoutMs: 60000 });

    const items = (resp && resp.tasks && resp.tasks[0] && resp.tasks[0].result &&
      resp.tasks[0].result[0] && resp.tasks[0].result[0].items) || [];

    return items
      .map((i) => ({
        keyword: String(i.keyword || '').trim().toLowerCase(),
        search_volume: i.keyword_info && i.keyword_info.search_volume,
        cpc: i.keyword_info && i.keyword_info.cpc,
        kd: i.keyword_properties && i.keyword_properties.keyword_difficulty,
        source: 'keyword_ideas',
      }))
      .filter((k) => k.keyword);
  } catch (e) {
    return [];
  }
}

// Layer 3: SERP features (PAA + Related Searches from seed keyword)
async function fetchSerpFeatures(seed, inputs) {
  try {
    const resp = await dfsPost('/serp/google/organic/live/advanced', [{
      keyword: seed,
      location_name: inputs.location,
      language_code: inputs.language,
      device: 'desktop',
      depth: 20,
    }], { timeoutMs: 60000 });

    const taskResult = resp && resp.tasks && resp.tasks[0] && resp.tasks[0].result &&
      resp.tasks[0].result[0];
    if (!taskResult) return [];

    const items = taskResult.items || [];
    const keywords = [];

    // Extract People Also Ask
    const paaItem = items.find((i) => i.type === 'people_also_ask');
    if (paaItem && Array.isArray(paaItem.items)) {
      for (const q of paaItem.items.slice(0, 10)) {
        if (q.title) {
          keywords.push({
            keyword: String(q.title).trim().toLowerCase(),
            search_volume: null,
            cpc: null,
            kd: null,
            source: 'paa',
          });
        }
      }
    }

    // Extract Related Searches
    const relatedItem = items.find((i) => i.type === 'related_searches');
    if (relatedItem && Array.isArray(relatedItem.items)) {
      for (const q of relatedItem.items.slice(0, 10)) {
        const kw = typeof q === 'string' ? q : (q.keyword || q.title || '');
        if (kw) {
          keywords.push({
            keyword: String(kw).trim().toLowerCase(),
            search_volume: null,
            cpc: null,
            kd: null,
            source: 'related_searches',
          });
        }
      }
    }

    return keywords;
  } catch (e) {
    return [];
  }
}

// Layer 4: Exa semantic search (community discussions, real questions)
async function fetchExaKeywords(seed) {
  try {
    const queries = [
      `${seed} related topics questions`,
      `${seed} long tail variations`,
      `${seed} people also search for`,
    ];

    const allKeywords = [];
    for (const query of queries) {
      try {
        const { results } = await exa.searchAndContents({
          query,
          numResults: 10,
          timeoutMs: 15000,
        });

        if (results) {
          for (const r of results) {
            // Extract keywords from titles
            const title = r.title || '';
            if (title && title.toLowerCase().includes(seed.toLowerCase().split(' ')[0])) {
              allKeywords.push({
                keyword: String(title).trim().toLowerCase(),
                search_volume: null,
                cpc: null,
                kd: null,
                source: 'exa',
              });
            }
          }
        }
      } catch (err) {
        // Continue to next query
      }
    }

    return allKeywords;
  } catch (e) {
    return [];
  }
}

// Layer 5: LLM generation (AI-powered keyword variations)
async function fetchLLMKeywords(seed) {
  try {
    const response = await chat({
      model: 'google/gemini-2.5-flash',
      messages: [{
        role: 'user',
        content: `Generate 15-20 long-tail keyword variations for: "${seed}"

Include:
- Question formats (how to, what is, best way to)
- Comparison formats (vs, alternatives, compared)
- Specific/niche angles
- Location-based variations if applicable
- Commercial intent variations (buy, price, cost, review)
- Informational variations (guide, tutorial, tips)

Return ONLY a JSON array of objects with fields: keyword (string)

Example format:
[
  {"keyword": "how to regrow hair naturally"},
  {"keyword": "best products for hair regrowth"},
  {"keyword": "hair regrowth vs hair transplant"}
]`,
      }],
      temperature: 0.7,
      timeoutMs: 30000,
    });

    const parsed = parseChatJson(response);
    if (parsed.error || !parsed.json) return [];

    // Handle both array and object formats
    const items = Array.isArray(parsed.json) ? parsed.json : (parsed.json.keywords || []);
    return items
      .filter((k) => k && k.keyword)
      .map((k) => ({
        keyword: String(k.keyword).trim().toLowerCase(),
        search_volume: null,
        cpc: null,
        kd: null,
        source: 'llm',
      }));
  } catch (e) {
    return [];
  }
}

// Parallel keyword expansion (all 5 layers simultaneously)
async function expandKeywordsParallel(inputs) {
  const seed = inputs.seed_keyword;

  // Fire all 5 layers in parallel
  const [suggestions, ideas, serpFeatures, exaKeywords, llmKeywords] = await Promise.all([
    fetchKeywordSuggestions(seed, inputs).catch(() => []),
    fetchKeywordIdeas(seed, inputs).catch(() => []),
    fetchSerpFeatures(seed, inputs).catch(() => []),
    fetchExaKeywords(seed).catch(() => []),
    fetchLLMKeywords(seed).catch(() => []),
  ]);

  // Merge all results
  const allKeywords = [
    ...suggestions,
    ...ideas,
    ...serpFeatures,
    ...exaKeywords,
    ...llmKeywords,
  ];

  // Deduplicate by keyword (case-insensitive)
  const seen = new Set();
  const unique = allKeywords.filter((k) => {
    const normalized = k.keyword.toLowerCase().trim();
    if (seen.has(normalized)) return false;
    // Also skip if too short or too long
    if (normalized.length < 3 || normalized.length > 100) return false;
    seen.add(normalized);
    return true;
  });

  // Always include seed keyword if not present
  const hasSeed = unique.some((k) => k.keyword === seed.toLowerCase());
  if (!hasSeed) {
    unique.unshift({
      keyword: seed.toLowerCase(),
      search_volume: null,
      cpc: null,
      kd: null,
      source: 'seed',
    });
  }

  // Sort: keywords with search_volume first, then by volume desc
  unique.sort((a, b) => {
    if (a.search_volume && b.search_volume) return b.search_volume - a.search_volume;
    if (a.search_volume) return -1;
    if (b.search_volume) return 1;
    return 0;
  });

  // Return top N (respect max_keywords)
  return unique.slice(0, inputs.max_keywords);
}

// ---------- step 2: SERP harvest ----------

async function fetchSerp(keyword, inputs) {
  const resp = await dfsPost('/serp/google/organic/live/advanced', [{
    keyword,
    location_name: inputs.location,
    language_code: inputs.language,
    device: 'desktop',
    depth: inputs.serp_depth,
  }], { timeoutMs: 60000 });

  const taskResult = resp && resp.tasks && resp.tasks[0] && resp.tasks[0].result &&
    resp.tasks[0].result[0];
  if (!taskResult) return { organic: [], features: {} };

  const items = taskResult.items || [];

  const organic = items
    .filter((i) => i.type === 'organic')
    .map((i) => ({
      position: i.rank_absolute,
      title: i.title,
      url: i.url,
      domain: String(i.domain || '').replace(/^www\./, '').toLowerCase(),
      description: i.description || '',
    }));

  // Extract SERP features
  const paaItem = items.find((i) => i.type === 'people_also_ask');
  const paa = paaItem && Array.isArray(paaItem.items)
    ? paaItem.items.slice(0, 8).map((q) => q.title).filter(Boolean)
    : [];

  const relatedItem = items.find((i) => i.type === 'related_searches');
  const related = relatedItem && Array.isArray(relatedItem.items)
    ? relatedItem.items.slice(0, 10)
    : [];

  return {
    organic,
    features: {
      people_also_ask: paa,
      related_searches: related,
    },
  };
}

// ---------- step 3: Domain Rank analysis ----------

function isUGC(domain) {
  const d = domain.toLowerCase();
  // Check exact matches
  if (UGC_DOMAINS.has(d)) return true;
  // Check subdomains (e.g., reddit.com, forum.example.com)
  for (const ugc of UGC_DOMAINS) {
    if (d.endsWith('.' + ugc) || d.startsWith(ugc.replace('.com', '').replace('.org', '').replace('.net', '') + '.')) {
      return true;
    }
  }
  // Check for forum/community patterns
  if (/^(forum|community|discuss|talk|chat|board)\./.test(d)) return true;
  return false;
}

function isHighAuthority(domain) {
  return HIGH_AUTHORITY_BLOCKLIST.has(domain.toLowerCase());
}

async function fetchDomainRank(domain) {
  const resp = await dfsPost('/backlinks/summary/live', [{
    target: domain,
    include_subdomains: true,
  }], { timeoutMs: 45000 });

  const task = resp && resp.tasks && resp.tasks[0];
  if (task && task.status_code === 20000 && task.result && task.result[0]) {
    const bl = task.result[0];
    // DataForSEO returns rank 0-1000, normalize to 0-100
    const rankRaw = bl.rank !== undefined ? bl.rank : 0;
    const dr = Math.round(rankRaw / 10);
    return {
      dr,
      referring_domains: bl.referring_domains || 0,
      backlinks: bl.backlinks || 0,
      spam_score: bl.info && bl.info.target_spam_score || 0,
    };
  }
  return { dr: null, referring_domains: 0, backlinks: 0, spam_score: 0 };
}

// ---------- step 4: weak spots calculation ----------

function calculateSD(greenFruits, ugcCount, weakPositions) {
  const totalWeak = greenFruits + ugcCount;

  // Count weak spots in top positions (1-3)
  const topWeakSpots = weakPositions.filter((p) => p <= 3).length;

  // SD 1 (Easy): 3+ weak spots OR 2+ in top 3
  if (totalWeak >= 3 || topWeakSpots >= 2) return 1;
  // SD 2 (Medium): 1-2 weak spots
  if (totalWeak >= 1) return 2;
  // SD 3 (Hard): no weak spots
  return 3;
}

function analyzeWeakSpots(serpResults, domainRanks, inputs) {
  const weakDomains = [];
  let greenFruits = 0;
  let ugcCount = 0;
  const weakPositions = [];

  for (const result of serpResults.organic) {
    const domain = result.domain;
    if (!domain) continue;

    // Skip high-authority blocklist domains
    if (isHighAuthority(domain)) continue;

    const rankData = domainRanks.get(domain);
    const dr = rankData ? rankData.dr : null;
    const ugc = isUGC(domain);

    let type = null;
    if (ugc && inputs.include_ugc) {
      type = 'blue_fruit';
      ugcCount++;
      weakPositions.push(result.position);
    } else if (dr !== null && dr < inputs.dr_threshold) {
      type = 'green_fruit';
      greenFruits++;
      weakPositions.push(result.position);
    }

    if (type) {
      weakDomains.push({
        domain,
        position: result.position,
        dr,
        type,
        url: result.url,
        title: result.title,
        referring_domains: rankData ? rankData.referring_domains : 0,
      });
    }
  }

  const sd = calculateSD(greenFruits, ugcCount, weakPositions);

  return {
    green_fruits: greenFruits,
    ugc_count: ugcCount,
    weak_spots_count: greenFruits + ugcCount,
    serp_difficulty: sd,
    weak_domains: weakDomains.sort((a, b) => a.position - b.position),
  };
}

// ---------- step 5: question discovery (optional, uses Exa) ----------

const EXA_SOURCE_CONFIG = {
  reddit: {
    includeDomains: ['reddit.com'],
    queryAugment: (kw) => `${kw} — people asking questions or discussing`,
    numResults: 8,
  },
  quora: {
    includeDomains: ['quora.com'],
    queryAugment: (kw) => `${kw} questions and answers`,
    numResults: 6,
  },
  forums: {
    excludeDomains: ['reddit.com', 'quora.com', 'youtube.com'],
    queryAugment: (kw) => `${kw} forum discussion community`,
    numResults: 8,
    category: 'social media',
  },
};

async function fetchQuestionsForKeyword(keyword) {
  const sources = ['reddit', 'quora', 'forums'];
  const promises = sources.map(async (source) => {
    const cfg = EXA_SOURCE_CONFIG[source];
    try {
      const { results } = await exa.searchAndContents({
        query: cfg.queryAugment(keyword),
        numResults: cfg.numResults,
        includeDomains: cfg.includeDomains,
        excludeDomains: cfg.excludeDomains,
        category: cfg.category,
        source,
        timeoutMs: 30000,
      });
      return { source, questions: (results || []).map((r) => ({
        question: r.title || '',
        url: r.url || '',
        source,
      })) };
    } catch {
      return { source, questions: [] };
    }
  });

  const results = await Promise.all(promises);
  const allQuestions = [];
  for (const r of results) {
    allQuestions.push(...r.questions);
  }
  return allQuestions;
}

// ---------- main handler ----------

async function handle(req, res) {
  const rawBody = req.body || {};

  if (isTestPing(rawBody)) {
    return res.json({
      ok: true,
      message: 'Keyword Research webhook reachable',
      received_at: new Date().toISOString(),
    });
  }

  const inputs = normalizeInput(rawBody);
  if (!inputs.seed_keyword) {
    return res.status(400).json({ error: 'seed_keyword is required' });
  }

  const t0 = Date.now();

  // Stage 1: Expand keywords (parallel layers for maximum discovery)
  const keywordObjs = await expandKeywordsParallel(inputs);
  if (!keywordObjs.length) {
    return res.json({
      request: inputs,
      keywords: [],
      diagnostics: { keywords_found: 0, elapsed_ms: Date.now() - t0 },
      generated_at: new Date().toISOString(),
    });
  }

  // Stage 2: SERP harvest for each keyword
  const serpResults = await runWithConcurrency(keywordObjs, SERP_CONCURRENCY, async (kwObj) => {
    try {
      const serp = await fetchSerp(kwObj.keyword, inputs);
      return { ...kwObj, serp };
    } catch (e) {
      return { ...kwObj, serp: { organic: [], features: {} }, _error: String(e && e.message || e) };
    }
  });

  // Stage 3: Collect unique domains and fetch their Domain Rank
  const domainSet = new Set();
  for (const kw of serpResults) {
    for (const r of (kw.serp && kw.serp.organic) || []) {
      if (r.domain && !isHighAuthority(r.domain)) {
        domainSet.add(r.domain);
      }
    }
  }

  const uniqueDomains = [...domainSet];
  const domainRankResults = await runWithConcurrency(uniqueDomains, DR_CONCURRENCY, async (domain) => {
    try {
      const rank = await fetchDomainRank(domain);
      return { domain, ...rank };
    } catch {
      return { domain, dr: null, referring_domains: 0, backlinks: 0, spam_score: 0 };
    }
  });

  const domainRanks = new Map();
  for (const dr of domainRankResults) {
    domainRanks.set(dr.domain, dr);
  }

  // Stage 4: Analyze weak spots for each keyword
  const keywordResults = serpResults.map((kw) => {
    const weakSpots = analyzeWeakSpots(kw.serp, domainRanks, inputs);
    return {
      keyword: kw.keyword,
      search_volume: kw.search_volume,
      cpc: kw.cpc,
      kd: kw.kd,
      source: kw.source || 'unknown',
      ...weakSpots,
    };
  });

  // Sort by opportunity: most weak spots first, then by search volume
  keywordResults.sort((a, b) => {
    if (b.weak_spots_count !== a.weak_spots_count) return b.weak_spots_count - a.weak_spots_count;
    return (b.search_volume || 0) - (a.search_volume || 0);
  });

  // Stage 5: Optional question discovery
  let questions = [];
  if (inputs.include_questions) {
    const topKeywords = keywordResults
      .filter((kw) => kw.weak_spots_count >= 2)
      .slice(0, 5)
      .map((kw) => kw.keyword);

    const questionResults = await Promise.all(
      topKeywords.map((kw) => fetchQuestionsForKeyword(kw).catch(() => []))
    );
    questions = questionResults.flat();
  }

  return res.json({
    request: {
      seed_keyword: inputs.seed_keyword,
      location: inputs.location,
      language: inputs.language,
      dr_threshold: inputs.dr_threshold,
      include_ugc: inputs.include_ugc,
    },
    keywords: keywordResults,
    questions: questions.length ? questions : undefined,
    diagnostics: {
      keywords_analyzed: keywordResults.length,
      total_domains_seen: uniqueDomains.length,
      weak_domains_found: keywordResults.reduce((s, kw) => s + kw.weak_spots_count, 0),
      keyword_sources: {
        keyword_suggestions: keywordResults.filter((k) => k.source === 'keyword_suggestions').length,
        keyword_ideas: keywordResults.filter((k) => k.source === 'keyword_ideas').length,
        paa: keywordResults.filter((k) => k.source === 'paa').length,
        related_searches: keywordResults.filter((k) => k.source === 'related_searches').length,
        exa: keywordResults.filter((k) => k.source === 'exa').length,
        llm: keywordResults.filter((k) => k.source === 'llm').length,
        seed: keywordResults.filter((k) => k.source === 'seed').length,
      },
      api_calls: {
        keyword_expansion: 5,
        serp_fetches: keywordResults.length,
        domain_rank_checks: uniqueDomains.length,
        exa_searches: inputs.include_questions ? (questions.length > 0 ? Math.ceil(questions.length / 10) : 0) : 0,
      },
      elapsed_ms: Date.now() - t0,
    },
    generated_at: new Date().toISOString(),
  });
}

module.exports = { handle };

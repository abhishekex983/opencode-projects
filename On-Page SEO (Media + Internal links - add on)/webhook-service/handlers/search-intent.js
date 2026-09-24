// Search Intent handler — port of the n8n "Search Intent Finder" workflow
// (search-intent-workflow.json). Same request/response shape as the live n8n
// webhook so the dashboard only swaps the URL.

const { dfsPost } = require('../util/dataforseo');
const { chat, parseChatJson } = require('../util/openrouter');

const LLM_MODEL = 'google/gemini-2.5-flash';

// ---------- input ----------

function normalizeInput(rawBody) {
  const body = (rawBody && typeof rawBody.body === 'object' && rawBody.body !== null) ? rawBody.body : (rawBody || {});

  let keywords = [];
  if (Array.isArray(body.keywords)) {
    keywords = body.keywords.map((k) => String(k).trim()).filter(Boolean);
  } else if (typeof body.keyword === 'string' && body.keyword.trim()) {
    keywords = [body.keyword.trim()];
  } else if (typeof body.keywords === 'string') {
    keywords = body.keywords.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  }
  keywords = [...new Set(keywords)];

  return {
    keywords,
    location: String(body.location || 'United States').trim(),
    language: String(body.language || 'en').trim(),
    device: String(body.device || 'desktop').trim(),
    industry: String(body.industry || '').trim(),
    requested_at: body.requested_at || new Date().toISOString(),
  };
}

// ---------- regex modifier classification (1:1 port) ----------

function classifyModifiers(kw) {
  const k = kw.toLowerCase();
  const signals = { transactional: 0, commercial: 0, informational: 0, navigational: 0, local: 0 };
  const hits = [];
  if (/\b(buy|purchase|order|book|schedule|hire|download|subscribe|sign[\s-]?up)\b/.test(k)) { signals.transactional += 3; hits.push('transactional verb'); }
  if (/\b(discount|coupon|deal|promo|price|pricing|cost|cheap|free trial)\b/.test(k)) { signals.transactional += 2; hits.push('price/discount modifier'); }
  if (/\b(best|top|vs|versus|review|reviews|compare|comparison|alternative|alternatives)\b/.test(k)) { signals.commercial += 3; hits.push('comparison/review modifier'); }
  if (/\b(pros and cons|worth it|good for|recommended)\b/.test(k)) { signals.commercial += 2; hits.push('evaluation phrase'); }
  if (/^(what|how|why|when|who|which|where|are|is|does|do|can|should)\b/.test(k)) { signals.informational += 3; hits.push('question starter'); }
  if (/\b(guide|tutorial|how to|tips|learn|examples|definition|meaning|ideas|template)\b/.test(k)) { signals.informational += 2; hits.push('learning modifier'); }
  if (/\b(login|sign in|dashboard|contact|support)\b/.test(k)) { signals.navigational += 2; hits.push('navigational modifier'); }
  if (/\bnear\s?me\b/.test(k)) { signals.local += 4; hits.push('"near me"'); }
  const ranked = Object.entries(signals).sort((a, b) => b[1] - a[1]);
  return { signals, top_label: ranked[0][1] > 0 ? ranked[0][0] : null, top_score: ranked[0][1], hits };
}

// ---------- SERP pruning (1:1 port) ----------

function pruneSerp(taskResult) {
  if (!taskResult) return null;
  const items = taskResult.items || [];

  const organic = items.filter((i) => i.type === 'organic').slice(0, 10).map((r) => ({
    position: r.rank_absolute,
    title: r.title,
    url: r.url,
    description: r.description,
    domain: r.domain,
  }));

  const featured = items.find((i) => i.type === 'featured_snippet') || null;
  const answerBox = items.find((i) => i.type === 'answer_box') || null;
  const knowledgeGraph = items.find((i) => i.type === 'knowledge_graph') || null;
  const aiOverview = items.find((i) => i.type === 'ai_overview') || null;
  const paaItem = items.find((i) => i.type === 'people_also_ask');
  const paa = paaItem ? (paaItem.items || []).slice(0, 6).map((q) => q.title).filter(Boolean) : [];
  const relatedItem = items.find((i) => i.type === 'related_searches');
  const related = relatedItem ? (relatedItem.items || []).slice(0, 8) : [];
  const localPack = items.filter((i) => i.type === 'local_pack').slice(0, 3).map((p) => ({
    title: p.title,
    rating: p.rating && p.rating.value,
  }));
  const videoCarousel = items.find((i) => i.type === 'video') || items.find((i) => i.type === 'videos');
  const shopping = items.find((i) => i.type === 'shopping');
  const imagePack = items.find((i) => i.type === 'images');

  return {
    organic,
    featured_snippet: featured ? { title: featured.title, description: featured.description } : null,
    knowledge_graph: knowledgeGraph ? { title: knowledgeGraph.title, description: knowledgeGraph.description } : null,
    ai_overview: aiOverview ? { text: aiOverview.text } : null,
    people_also_ask: paa,
    related_searches: related,
    local_pack: localPack,
    feature_presence: {
      featured_snippet: !!featured,
      answer_box: !!answerBox,
      knowledge_graph: !!knowledgeGraph,
      ai_overview: !!aiOverview,
      people_also_ask: paa.length > 0,
      local_pack: localPack.length > 0,
      video_carousel: !!videoCarousel,
      shopping_pack: !!shopping,
      image_pack: !!imagePack,
    },
    all_item_types: [...new Set(items.map((i) => i.type))],
  };
}

// ---------- prompts (1:1 port) ----------

const SYSTEM_PROMPT = [
  "You are a senior SEO analyst specializing in search intent classification. Your job: classify a single keyword's search intent using both query modifiers and the actual live SERP it returns, then produce an actionable JSON brief for a content writer.",
  '',
  'GROUNDING RULES (non-negotiable):',
  '1. Use only facts from the <data> blocks. Do not invent SERP features, modifiers, or sub-intents.',
  '2. When modifier-derived intent disagrees with SERP-derived intent, TRUST THE SERP. Set conflict=true and explain in conflict_message. Canonical example: the keyword "macbook air pros and cons" has modifier signals pointing to Commercial Investigation (product name + "pros and cons"), but if the SERP is dominated by editorial review articles, primary_intent is Informational and conflict is true.',
  '3. Sub-intent weights MUST sum to ~100 and reflect the distribution of distinct user needs across the top 10 organic results + People Also Ask. Maximum 6 sub-intents. Group small ones into broader buckets. Each label is a short noun-phrase (e.g. "Pros and cons / review", "Comparison vs other MacBooks", "Who should buy it").',
  '4. Confidence reflects signal agreement: 80-95 when modifier+SERP agree, 60-79 when partial conflict, 30-59 when SERP sharply overrides modifier or SERP is ambiguous.',
  '',
  'TAXONOMY:',
  '- primary_intent: one of Informational | Commercial Investigation | Transactional | Navigational | Local',
  '- secondary_intent: same set, or empty string if no meaningful secondary',
  '- funnel_stage: Awareness | Interest | Consideration | Decision',
  '',
  'RECOMMENDED ARCHETYPES (pick one that matches primary_intent + sub-intents):',
  'How-to article, Explainer / glossary, Listicle / roundup, Comparison / vs page, Review / pros-and-cons article, Product page, Category page, Pricing page, Local service page, Location landing page, Homepage / brand page',
  '',
  'SERP FEATURES (use canonical names): featured_snippet, answer_box, knowledge_graph, ai_overview, people_also_ask, local_pack, video_carousel, shopping_pack, image_pack, sitelinks, top_stories.',
  'serp_features.present = the features that ACTUALLY exist in this SERP.',
  'serp_features.to_win = the subset the new page should target (e.g. featured_snippet if there is a question-style sub-intent and no featured_snippet currently owned; people_also_ask if PAA is present).',
  '',
  'OUTPUT: valid JSON only. No markdown code fences. No prose outside JSON. Schema exactly:',
  '{',
  '  "keyword": "string",',
  '  "primary_intent": "Informational|Commercial Investigation|Transactional|Navigational|Local",',
  '  "secondary_intent": "string",',
  '  "funnel_stage": "Awareness|Interest|Consideration|Decision",',
  '  "confidence": integer 0-100,',
  '  "conflict": boolean,',
  '  "conflict_message": "one sentence or empty string",',
  '  "sub_intents": [ { "label": "string", "weight": integer 0-100 } ],',
  '  "evidence": [ "Short bullet prefixed with [SERP], [MOD], or [PAA] showing the signal used." ],',
  '  "recommended_archetype": "string from the archetypes list",',
  '  "archetype_rationale": "one sentence",',
  '  "serp_features": { "present": ["..."], "to_win": ["..."] }',
  '}',
].join('\n');

function buildUserPrompt(item) {
  return [
    'KEYWORD: ' + item.keyword,
    'LOCATION: ' + item.location,
    'LANGUAGE: ' + item.language,
    'DEVICE: ' + item.device,
    item.industry ? ('INDUSTRY CONTEXT: ' + item.industry) : '',
    '',
    '<data source="MOD" note="Regex-based modifier classification. top_label is the highest-scoring intent from query modifiers alone.">',
    JSON.stringify(item.modifier, null, 2),
    '</data>',
    '',
    '<data source="SERP" note="Pruned DataForSEO SERP. Top 10 organic + features + PAA + related searches.">',
    JSON.stringify(item.serp, null, 2),
    '</data>',
    '',
    'Return only the JSON object as specified.',
  ].filter(Boolean).join('\n');
}

// ---------- keyword difficulty ----------
//
// DataForSEO Labs returns a 0–100 score derived from the backlink profile of
// the top-ranking pages. A single bulk call covers the whole batch (up to
// 1000 keywords), so we do it once alongside the per-keyword SERP fan-out.
// Bands match common SEO conventions (Ahrefs/Moz-style).

function difficultyBand(kd) {
  if (kd == null || Number.isNaN(kd)) return null;
  if (kd < 15) return 'Very Easy';
  if (kd < 30) return 'Easy';
  if (kd < 50) return 'Medium';
  if (kd < 70) return 'Hard';
  if (kd < 85) return 'Very Hard';
  return 'Super Hard';
}

async function fetchKeywordDifficulty(keywords, location, language) {
  try {
    const resp = await dfsPost('/dataforseo_labs/google/bulk_keyword_difficulty/live', [{
      keywords,
      location_name: location,
      language_code: language,
    }], { timeoutMs: 30000 });
    const items = resp && resp.tasks && resp.tasks[0] && resp.tasks[0].result && resp.tasks[0].result[0] && resp.tasks[0].result[0].items;
    if (!Array.isArray(items)) return new Map();
    const map = new Map();
    for (const it of items) {
      if (it && it.keyword) {
        const kd = typeof it.keyword_difficulty === 'number' ? it.keyword_difficulty : null;
        map.set(String(it.keyword).toLowerCase(), kd);
      }
    }
    return map;
  } catch (_e) {
    return new Map();
  }
}

// ---------- backlink profile of top 10 ----------
//
// Pulls per-page backlink stats for each keyword's top 10 organic URLs via
// /backlinks/bulk_pages_summary/live. One bulk call per keyword (10 targets
// each). Returns per-URL data plus aggregates so the UI can show where the
// weak spots in the SERP are — that's where new content can realistically
// outrank.

function median(nums) {
  const arr = nums.filter((n) => typeof n === 'number' && !Number.isNaN(n)).slice().sort((a, b) => a - b);
  if (!arr.length) return null;
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : Math.round((arr[mid - 1] + arr[mid]) / 2);
}

async function fetchBacklinkProfile(serp) {
  if (!serp || !Array.isArray(serp.organic) || !serp.organic.length) return null;
  const targets = serp.organic.map((r) => r.url).filter(Boolean).slice(0, 10);
  if (!targets.length) return null;

  try {
    const resp = await dfsPost('/backlinks/bulk_pages_summary/live', [{ targets }], { timeoutMs: 45000 });
    const items = resp && resp.tasks && resp.tasks[0] && resp.tasks[0].result;
    if (!Array.isArray(items) || !items.length) return null;

    // Map back to SERP order. DataForSEO returns items in submitted order, but
    // also includes the target string, so we look up by URL to be safe.
    const byUrl = new Map();
    for (const it of items) {
      if (it && it.target) byUrl.set(String(it.target), it);
    }

    const perUrl = serp.organic.slice(0, 10).map((r) => {
      const item = byUrl.get(r.url) || {};
      return {
        position: r.position,
        domain: r.domain,
        url: r.url,
        title: r.title,
        backlinks: typeof item.backlinks === 'number' ? item.backlinks : null,
        referring_domains: typeof item.referring_domains === 'number' ? item.referring_domains : null,
        referring_main_domains: typeof item.referring_main_domains === 'number' ? item.referring_main_domains : null,
        rank: typeof item.rank === 'number' ? item.rank : null,
      };
    });

    const refDomainsList = perUrl.map((p) => p.referring_domains);
    const rankList = perUrl.map((p) => p.rank);
    const aggregates = {
      median_referring_domains: median(refDomainsList),
      median_rank: median(rankList),
    };

    // Weakest spot = SERP position with the lowest page rank (treat null as
    // unknown, skip from comparison). This is the most realistic outrank target.
    const ranked = perUrl.filter((p) => typeof p.rank === 'number');
    if (ranked.length) {
      const weakest = ranked.reduce((min, cur) => (cur.rank < min.rank ? cur : min), ranked[0]);
      aggregates.weakest_position = weakest.position;
      aggregates.weakest_rank = weakest.rank;
    }

    return { per_url: perUrl, aggregates };
  } catch (_e) {
    return null;
  }
}

// ---------- weight normalization (1:1 port) ----------

function normalizeWeights(parsed) {
  if (Array.isArray(parsed.sub_intents) && parsed.sub_intents.length) {
    const total = parsed.sub_intents.reduce((s, x) => s + (Number(x.weight) || 0), 0);
    if (total > 0 && Math.abs(total - 100) > 5) {
      parsed.sub_intents = parsed.sub_intents.map((x) => ({
        label: x.label || '',
        weight: Math.round((Number(x.weight) || 0) * 100 / total),
      }));
    }
  }
  return parsed;
}

// ---------- per-keyword LLM call ----------

async function classifyOne(item) {
  if (item.serp_missing || !item.serp) {
    return { keyword: item.keyword, error: 'No SERP data returned by DataForSEO for this keyword.' };
  }

  const response = await chat({
    model: LLM_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(item) },
    ],
    temperature: 0.2,
    responseFormat: 'json_object',
    timeoutMs: 60000,
    title: 'On-Page SEO :: Search Intent Finder',
  });

  const parsed = parseChatJson(response);
  if (parsed.error) {
    return { keyword: item.keyword, error: parsed.error, raw_text: parsed.raw_text, raw: parsed.raw };
  }

  const normalized = normalizeWeights(parsed.json);
  normalized.keyword = normalized.keyword || item.keyword;
  return normalized;
}

// ---------- handler ----------

async function handle(req, res) {
  const rawBody = req.body || {};

  if (rawBody.test === true || (rawBody.body && rawBody.body.test === true)) {
    return res.json({
      ok: true,
      message: 'Search Intent webhook reachable',
      received_at: new Date().toISOString(),
    });
  }

  const inputs = normalizeInput(rawBody);

  if (inputs.keywords.length === 0) {
    return res.status(400).json({ error: 'No keywords provided.' });
  }
  if (inputs.keywords.length > 25) {
    return res.status(400).json({ error: `Maximum 25 keywords per batch (received ${inputs.keywords.length}).` });
  }

  // Stage 1: fan out one DataForSEO SERP call per keyword in parallel, and a
  // single bulk KD call for the whole batch — both kicked off together.
  //
  // The n8n original sent all keywords in a single batched array, but
  // DataForSEO's /serp/google/organic/live/advanced enforces "one task at a
  // time" — every task past the first comes back with status 40000 and no
  // SERP data. The bug only ever surfaced on multi-keyword runs. We fan out
  // in parallel so total latency is ~max(per-call) instead of N × per-call.
  const serpPromise = Promise.all(inputs.keywords.map((kw) =>
    dfsPost('/serp/google/organic/live/advanced', [{
      keyword: kw,
      location_name: inputs.location,
      language_code: inputs.language,
      device: inputs.device,
      depth: 20,
    }], { timeoutMs: 60000 }).catch(() => null)
  ));
  const kdPromise = fetchKeywordDifficulty(inputs.keywords, inputs.location, inputs.language);
  const [dfsResults, kdMap] = await Promise.all([serpPromise, kdPromise]);

  // Stage 2: per-keyword modifier + SERP prune.
  const perKeyword = inputs.keywords.map((kw, i) => {
    const resp = dfsResults[i];
    const taskResult = resp && resp.tasks && resp.tasks[0] && resp.tasks[0].result && resp.tasks[0].result[0];
    const serp = pruneSerp(taskResult);
    return {
      keyword: kw,
      location: inputs.location,
      language: inputs.language,
      device: inputs.device,
      industry: inputs.industry,
      modifier: classifyModifiers(kw),
      serp,
      serp_missing: !serp,
    };
  });

  // Stage 3: fan out LLM classification + backlink-profile lookup in parallel.
  // Both depend on the SERP, but not on each other. Running them side-by-side
  // keeps total wall-clock at ~max(LLM, backlinks) instead of LLM + backlinks.
  const llmSettled = Promise.allSettled(perKeyword.map(classifyOne));
  const backlinksSettled = Promise.allSettled(perKeyword.map((item) => fetchBacklinkProfile(item.serp)));
  const [settled, backlinkResults] = await Promise.all([llmSettled, backlinksSettled]);

  // Stage 4: aggregate in request order, attaching KD + backlink profile per keyword.
  const results = settled.map((r, i) => {
    const kw = inputs.keywords[i];
    const kd = kdMap.get(String(kw).toLowerCase());
    const kdFields = (typeof kd === 'number')
      ? { keyword_difficulty: kd, difficulty_band: difficultyBand(kd) }
      : { keyword_difficulty: null, difficulty_band: null };
    const bl = backlinkResults[i];
    const backlinkProfile = bl && bl.status === 'fulfilled' ? bl.value : null;
    const extra = Object.assign({}, kdFields, { backlink_profile: backlinkProfile });
    if (r.status === 'fulfilled') return Object.assign({}, r.value, extra);
    return Object.assign({ keyword: kw, error: 'No result returned from pipeline: ' + (r.reason && r.reason.message ? r.reason.message : String(r.reason)) }, extra);
  });

  return res.json({
    results,
    request: {
      keywords: inputs.keywords,
      location: inputs.location,
      language: inputs.language,
      device: inputs.device,
      industry: inputs.industry,
    },
    generated_at: new Date().toISOString(),
  });
}

module.exports = { handle };

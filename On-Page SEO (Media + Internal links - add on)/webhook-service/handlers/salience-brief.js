// Salience Brief handler — port of the n8n "Salience Brief" workflow.
// Same request/response shape as the live n8n webhook so the dashboard
// only swaps the URL.

const { dfsPost } = require('../util/dataforseo');
const { requestText } = require('../util/http');
const { analyzeEntitiesHtml } = require('../util/nlp');
const { chat, parseChatJson } = require('../util/openrouter');

const AI_MODEL = 'google/gemini-2.5-pro';

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; SalienceBriefBot/1.0; +https://shettymarketing.com)',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};

// ---------- input ----------

function normalizeInput(rawBody) {
  const body = (rawBody && typeof rawBody.body === 'object' && rawBody.body !== null) ? rawBody.body : (rawBody || {});
  return {
    keyword: String(body.keyword || '').trim(),
    location: String(body.location || 'United States').trim(),
    language: String(body.language || 'en').trim(),
    requested_at: body.requested_at || new Date().toISOString(),
  };
}

// ---------- math helpers ----------

function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ---------- per-URL fetch + NLP ----------

async function analyzeOnePage(o, language) {
  const html = await requestText({
    method: 'GET',
    url: o.url,
    headers: FETCH_HEADERS,
    timeoutMs: 12000,
  });

  if (!html) {
    return { rank: o.rank, title: o.title, url: o.url, error: 'fetch failed or empty body' };
  }

  const cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, ' ');
  const truncated = cleaned.slice(0, 30000);

  const plainForCount = truncated.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainForCount ? plainForCount.split(/\s+/).filter(Boolean).length : 0;

  const nlpResp = await analyzeEntitiesHtml({ html: truncated, language });

  if (nlpResp && nlpResp._error) {
    return { rank: o.rank, title: o.title, url: o.url, word_count: wordCount, error: 'nlp failed: ' + nlpResp._error };
  }
  if (nlpResp && nlpResp.error) {
    return { rank: o.rank, title: o.title, url: o.url, word_count: wordCount, error: 'nlp returned error', detail: nlpResp.error };
  }

  const ents = (nlpResp.entities || []).map((e) => ({
    name: e.name,
    type: e.type,
    salience: Number(e.salience) || 0,
    mentions: (e.mentions || []).length,
  }));

  return {
    rank: o.rank,
    title: o.title,
    url: o.url,
    domain: o.domain,
    word_count: wordCount,
    entity_count: ents.length,
    top_entities: ents.slice(0, 15),
    _all_entities: ents,
  };
}

// ---------- aggregation ----------

function aggregateEntities(perUrl) {
  const allEntityNames = new Map();
  for (const p of perUrl) {
    if (p.error || !p._all_entities) continue;
    for (const e of p._all_entities) {
      if (!e.name) continue;
      const key = e.name.toLowerCase();
      let agg = allEntityNames.get(key);
      if (!agg) {
        agg = { name: e.name, type: e.type, sals: [], appearsIn: new Set(), mentions: 0 };
        allEntityNames.set(key, agg);
      }
      agg.sals.push(e.salience);
      agg.appearsIn.add(p.url);
      agg.mentions += e.mentions;
    }
  }

  const aggregated = [];
  for (const agg of allEntityNames.values()) {
    aggregated.push({
      name: agg.name,
      type: agg.type,
      median_salience: median(agg.sals),
      max_salience: Math.max.apply(null, agg.sals),
      appears_in: agg.appearsIn.size,
      total_mentions: agg.mentions,
      must_cover: false,
    });
  }
  aggregated.sort((a, b) => (b.appears_in * b.median_salience) - (a.appears_in * a.median_salience));
  return aggregated;
}

// ---------- LLM prompt ----------

const SYSTEM_PROMPT = [
  "You are a senior SEO content strategist building a salience-grounded content brief. The user wants to write a NEW page for the given keyword and needs to know what to cover so Google's NLP reads the page as salient on this topic.",
  '',
  'GROUNDING RULES (non-negotiable):',
  '1. Base EVERY recommendation on the <signals> below: empirical salience data from the top-10 ranking pages, PAA questions, and related searches.',
  '2. Use the EXACT entity names from the aggregated data when listing must-cover entities.',
  '3. must_cover_entities: entities with high appearance frequency (appears_in >= half the analyzed pages) AND meaningful median salience (>= 0.02). Cap at 8 must-cover.',
  '4. h2_candidates: group related must-cover entities into proposed H2 headings. Each H2 should cover 1-3 entities. Aim for 4-6 H2 candidates.',
  '5. faq_candidates: include PAA questions verbatim where useful (set from_paa: true), plus 1-2 originals if helpful for entity coverage.',
  '6. supporting_topics: 3-6 sub-topics that supporting entities and n-gram patterns suggest. Should NOT duplicate must-cover entities.',
  '7. Be honest about predicted word count: use the median_word_count as the anchor.',
  '8. competitive_note: 1 sentence about top-ranker archetype (review/listicle/service-page/glossary) and any gap a new page could exploit.',
  '',
  'OUTPUT: JSON only. No markdown fences. Schema EXACTLY:',
  '{',
  '  "summary": "1-2 sentence positioning statement about what a page for this keyword should fundamentally be about",',
  '  "must_cover_entities": [ { "name": "exact name from data", "type": "...", "appears_in": N, "median_salience": X.XX, "rationale": "1 sentence" } ],',
  '  "supporting_topics": [ { "topic": "name", "why": "1 sentence" } ],',
  '  "h2_candidates": [ { "heading": "proposed H2 wording", "covers_entities": ["entity1", "entity2"] } ],',
  '  "faq_candidates": [ { "question": "...", "from_paa": true, "why": "1 sentence" } ],',
  '  "predicted_minimum_word_count": "X-Y words (matched to median of analyzed pages)",',
  '  "competitive_note": "1 sentence about top-rankers archetype + any gap a new page could exploit"',
  '}',
].join('\n');

function buildUserPrompt({ keyword, location, language, stats, topEntities, paa, related, sources }) {
  return [
    'TARGET KEYWORD: ' + keyword,
    'LOCATION: ' + location,
    'LANGUAGE: ' + language,
    '',
    '<signals>',
    'STATS: ' + JSON.stringify(stats),
    '',
    'TOP AGGREGATED ENTITIES (from Google NLP across top-10 pages, sorted by reach x median salience):',
    JSON.stringify(topEntities, null, 2),
    '',
    'PEOPLE ALSO ASK:',
    paa.length ? paa.map((p) => '- ' + p).join('\n') : '(none)',
    '',
    'RELATED SEARCHES:',
    related.length ? related.map((p) => '- ' + p).join('\n') : '(none)',
    '',
    'PAGES ANALYZED:',
    sources.map((s) => '#' + s.rank + ' ' + s.title + ' (' + s.url + ') -- ' + s.entity_count + ' entities, ' + s.word_count + ' words').join('\n'),
    '</signals>',
    '',
    'Return the brief as JSON.',
  ].join('\n');
}

// ---------- handler ----------

async function handle(req, res) {
  const rawBody = req.body || {};

  if (rawBody.test === true || (rawBody.body && rawBody.body.test === true)) {
    return res.json({
      ok: true,
      message: 'Salience Brief webhook reachable',
      received_at: new Date().toISOString(),
    });
  }

  const inputs = normalizeInput(rawBody);

  if (!inputs.keyword) {
    return res.status(400).json({ error: 'keyword is required' });
  }

  // Stage 1: SERP.
  const serpResp = await dfsPost('/serp/google/organic/live/advanced', [{
    keyword: inputs.keyword,
    location_name: inputs.location,
    language_code: inputs.language,
    device: 'desktop',
    depth: 20,
  }], { timeoutMs: 60000 });

  const result = serpResp && serpResp.tasks && serpResp.tasks[0] && serpResp.tasks[0].result && serpResp.tasks[0].result[0];
  if (!result) {
    return res.json({
      error: 'No SERP result from DataForSEO',
      detail: serpResp && (serpResp.status_message || serpResp.tasks),
    });
  }

  const items = result.items || [];
  const organic = items.filter((i) => i.type === 'organic').slice(0, 10).map((o) => ({
    rank: o.rank_absolute,
    title: o.title,
    url: o.url,
    description: o.description,
    domain: o.domain,
  }));

  if (organic.length === 0) {
    return res.json({ error: 'No organic results returned for this keyword + location' });
  }

  const paaItem = items.find((i) => i.type === 'people_also_ask');
  const paa = paaItem ? (paaItem.items || []).slice(0, 8).map((q) => q.title).filter(Boolean) : [];
  const relatedItem = items.find((i) => i.type === 'related_searches');
  const related = relatedItem ? (relatedItem.items || []).slice(0, 8) : [];

  // Stage 2: fetch + NLP for all 10 pages in parallel.
  // n8n loops sequentially (~10×~5s = ~50s). Parallel cuts wall-clock to max-page-latency.
  const settled = await Promise.allSettled(organic.map((o) => analyzeOnePage(o, inputs.language)));
  const perUrl = settled.map((s, i) => {
    if (s.status === 'fulfilled') return s.value;
    const o = organic[i];
    return { rank: o.rank, title: o.title, url: o.url, error: 'pipeline error: ' + (s.reason && s.reason.message ? s.reason.message : String(s.reason)) };
  });

  // Stage 3: aggregate.
  const aggregated = aggregateEntities(perUrl);
  const wordCounts = perUrl.filter((p) => !p.error && p.word_count != null).map((p) => p.word_count);
  const pagesAnalyzed = perUrl.filter((p) => !p.error).length;

  const stats = {
    pages_analyzed: pagesAnalyzed,
    pages_failed: organic.length - pagesAnalyzed,
    median_word_count: wordCounts.length ? Math.round(median(wordCounts)) : null,
    unique_entities: aggregated.length,
  };

  const sources = perUrl.map((p) => ({
    rank: p.rank,
    title: p.title,
    url: p.url,
    entity_count: p.entity_count || 0,
    word_count: p.word_count,
    error: p.error,
  }));

  // Stage 4: LLM brief.
  const topEntities = aggregated.slice(0, 25);
  const sourcesForPrompt = sources.filter((s) => !s.error);

  const userPrompt = buildUserPrompt({
    keyword: inputs.keyword,
    location: inputs.location,
    language: inputs.language,
    stats,
    topEntities,
    paa,
    related,
    sources: sourcesForPrompt,
  });

  let brief = {
    summary: '',
    must_cover_entities: [],
    supporting_topics: [],
    h2_candidates: [],
    faq_candidates: paa.map((q) => ({ question: q, from_paa: true, why: 'From People Also Ask.' })),
    predicted_minimum_word_count: stats.median_word_count ? (stats.median_word_count + ' words (median of analyzed pages)') : '',
    competitive_note: '',
  };
  let aiError = null;

  const llmResp = await chat({
    model: AI_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.25,
    responseFormat: 'json_object',
    timeoutMs: 90000,
    title: 'On-Page SEO :: Salience Brief',
  });

  const parsed = parseChatJson(llmResp);
  if (parsed.error) {
    aiError = parsed.error;
    if (parsed.raw_text) brief.raw_text = parsed.raw_text;
  } else {
    brief = { ...brief, ...parsed.json };
  }

  // Stage 5: mark must_cover on aggregated entities from the LLM list.
  const mustCoverNames = new Set(
    (brief.must_cover_entities || []).map((e) => String(e.name || '').toLowerCase()).filter(Boolean)
  );
  const entities = aggregated.map((e) => ({
    ...e,
    must_cover: mustCoverNames.has(String(e.name || '').toLowerCase()),
  }));

  const final = {
    keyword: inputs.keyword,
    location: inputs.location,
    language: inputs.language,
    summary: brief.summary || '',
    entities,
    supporting_topics: brief.supporting_topics || [],
    h2_candidates: brief.h2_candidates || [],
    faq_candidates: brief.faq_candidates || [],
    predicted_minimum_word_count: brief.predicted_minimum_word_count || '',
    competitive_note: brief.competitive_note || '',
    paa,
    related_searches: related,
    sources,
    stats,
    ai_model: AI_MODEL,
    generated_at: new Date().toISOString(),
  };
  if (aiError) final.ai_error = aiError;

  return res.json(final);
}

module.exports = { handle };

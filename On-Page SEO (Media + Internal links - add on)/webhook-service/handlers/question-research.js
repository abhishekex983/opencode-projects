// Question Research handler — finds the underlying *problems* users have
// around a keyword, not just literal questions.
//
// Pipeline:
//   1. DataforSEO SERP → People Also Ask (keyword-anchored, location-aware)
//   2. Exa neural search × 4 lanes in parallel (Reddit, Quora, niche forums,
//      YouTube). Each lane pulls semantically-related threads — not keyword
//      matches — then Exa /contents returns the cleaned body + top
//      query-relevant highlights.
//   3. Gemini 2.5 Flash (via OpenRouter) clusters the raw signal into
//      problem clusters with supporting questions, representative quotes,
//      and citations back to the source URLs.
//
// Response shape is intentionally flat-ish so the dashboard renderer can
// iterate clusters → questions → citations without nested guessing.

const { dfsPost } = require('../util/dataforseo');
const exa = require('../util/exa');
const { chat, parseChatJson } = require('../util/openrouter');

const LLM_MODEL = 'google/gemini-2.5-flash';

const SOURCE_CONFIG = {
  reddit: {
    includeDomains: ['reddit.com'],
    queryAugment: (kw) => `${kw} — people asking questions or describing problems`,
    numResults: 12,
  },
  quora: {
    includeDomains: ['quora.com'],
    queryAugment: (kw) => `${kw} questions and answers`,
    numResults: 8,
  },
  forums: {
    // Niche/tech forums and Q&A boards Exa surfaces via neural ranking. We
    // *exclude* the big ones we hit separately so we don't double-count.
    excludeDomains: ['reddit.com', 'quora.com', 'youtube.com', 'youtu.be'],
    queryAugment: (kw) => `${kw} forum discussion troubleshooting community thread`,
    numResults: 10,
    category: 'social media',
  },
  youtube: {
    includeDomains: ['youtube.com', 'youtu.be'],
    queryAugment: (kw) => `${kw} explained — viewer questions in comments`,
    numResults: 6,
  },
};

// ---------- input ----------

function normalizeInput(rawBody) {
  const body = (rawBody && typeof rawBody.body === 'object' && rawBody.body !== null) ? rawBody.body : (rawBody || {});

  const keyword = String(body.keyword || '').trim();

  // Sources: array of strings the user opted into. Defaults to all four.
  const requested = Array.isArray(body.sources) && body.sources.length
    ? body.sources.map((s) => String(s).toLowerCase().trim())
    : ['reddit', 'quora', 'forums', 'youtube'];
  const sources = requested.filter((s) => SOURCE_CONFIG[s]);

  return {
    keyword,
    location: String(body.location || 'United States').trim(),
    language: String(body.language || 'en').trim(),
    device: String(body.device || 'desktop').trim(),
    industry: String(body.industry || '').trim(),
    sources,
    requested_at: body.requested_at || new Date().toISOString(),
  };
}

// ---------- PAA fetch ----------

async function fetchPaa(keyword, location, language, device) {
  const resp = await dfsPost('/serp/google/organic/live/advanced', [{
    keyword,
    location_name: location,
    language_code: language,
    device,
    depth: 20,
  }], { timeoutMs: 60000 }).catch(() => null);

  const taskResult = resp && resp.tasks && resp.tasks[0] && resp.tasks[0].result && resp.tasks[0].result[0];
  if (!taskResult) return [];
  const items = taskResult.items || [];
  const paaItem = items.find((i) => i.type === 'people_also_ask');
  if (!paaItem || !Array.isArray(paaItem.items)) return [];

  // PAA items can have nested expanded_element with the actual answer snippet.
  return paaItem.items.slice(0, 10).map((q) => {
    const expanded = Array.isArray(q.expanded_element) && q.expanded_element[0] ? q.expanded_element[0] : null;
    return {
      question: q.title || '',
      answer_snippet: expanded ? (expanded.description || expanded.featured_title || '') : '',
      source_url: expanded ? (expanded.url || '') : '',
      source_domain: expanded ? (expanded.domain || '') : '',
    };
  }).filter((q) => q.question);
}

// ---------- Exa fan-out ----------

async function fetchSource(source, keyword) {
  const cfg = SOURCE_CONFIG[source];
  if (!cfg) return { source, results: [] };
  try {
    const { results, error } = await exa.searchAndContents({
      query: cfg.queryAugment(keyword),
      numResults: cfg.numResults,
      includeDomains: cfg.includeDomains,
      excludeDomains: cfg.excludeDomains,
      category: cfg.category,
      source,
      timeoutMs: 45000,
    });
    return { source, results: results || [], error: error || null };
  } catch (e) {
    return { source, results: [], error: e && e.message ? e.message : String(e) };
  }
}

// ---------- pruning for LLM context ----------

function buildEvidenceBlock(source, items) {
  if (!items.length) return '';
  const rows = items.slice(0, 12).map((it, idx) => {
    const id = `${source[0].toUpperCase()}${idx + 1}`;
    const title = (it.title || '').replace(/\s+/g, ' ').trim().slice(0, 200);
    const highlights = Array.isArray(it.highlights) ? it.highlights.slice(0, 3).map((h) => `  · ${String(h).replace(/\s+/g, ' ').trim().slice(0, 320)}`).join('\n') : '';
    const textSample = it.text ? String(it.text).replace(/\s+/g, ' ').trim().slice(0, 600) : '';
    return [
      `[${id}] ${title}`,
      it.url ? `URL: ${it.url}` : '',
      highlights ? `Top passages:\n${highlights}` : '',
      textSample ? `Body excerpt: ${textSample}` : '',
    ].filter(Boolean).join('\n');
  });
  return `=== ${source.toUpperCase()} (${items.length} items) ===\n` + rows.join('\n\n');
}

function buildPaaBlock(paa) {
  if (!paa.length) return '';
  const rows = paa.map((q, idx) => {
    const id = `PAA${idx + 1}`;
    return [
      `[${id}] ${q.question}`,
      q.answer_snippet ? `Snippet: ${String(q.answer_snippet).replace(/\s+/g, ' ').trim().slice(0, 320)}` : '',
      q.source_url ? `Source: ${q.source_url}` : '',
    ].filter(Boolean).join('\n');
  });
  return `=== GOOGLE PEOPLE ALSO ASK (${paa.length} items) ===\n` + rows.join('\n\n');
}

// ---------- LLM clustering prompt ----------

const SYSTEM_PROMPT = [
  'You are a senior content strategist analysing audience research for an SEO/content brief. Your job: read a pile of raw evidence (Google People Also Ask + Reddit/Quora/forum/YouTube threads) about ONE keyword and group it into the underlying USER PROBLEMS.',
  '',
  'CRITICAL RULES:',
  '1. Group by *underlying problem*, not by literal wording. "Will it hurt?", "Is the procedure painful?", and "Anaesthesia options" all belong to the same Pain/Comfort cluster.',
  '2. Use only the evidence provided. Never invent quotes, URLs, or claims. If evidence is thin, return fewer clusters with lower confidence — do not pad.',
  '3. Every cluster must cite at least one evidence ID (e.g. [PAA3], [R5], [Q2], [F1], [Y2]). Cite the IDs as they appear in the evidence blocks below.',
  '4. Produce 4–8 clusters total. Bigger clusters first (more supporting evidence). Drop clusters with <2 supporting items unless the signal is unusually strong.',
  '5. `representative_questions` are the 3–6 best-phrased questions a content writer could literally use as H2s or FAQ entries — pick from the evidence or paraphrase tightly, never invent from thin air.',
  '6. `representative_quotes` are short verbatim snippets that capture the user emotion or specifics. Keep under ~30 words each. Include the citation ID inline.',
  '7. `intent_signal` describes what stage the user is in (e.g. "comparing options before buying", "troubleshooting after purchase", "researching before deciding").',
  '8. `content_angle` is one sentence telling the writer how to address this cluster on-page (e.g. "Open with a calming explainer plus a 30-sec video of the procedure").',
  '',
  'OUTPUT: valid JSON only. No markdown fences. No prose outside JSON. Schema exactly:',
  '{',
  '  "keyword": "string",',
  '  "summary": "2–3 sentence overview of what the audience is actually struggling with around this keyword",',
  '  "clusters": [',
  '    {',
  '      "title": "Short noun-phrase (max 8 words)",',
  '      "problem": "1–2 sentences describing the underlying user problem",',
  '      "intent_signal": "string",',
  '      "content_angle": "string",',
  '      "representative_questions": ["string", ...],',
  '      "representative_quotes": [{ "quote": "string", "cite": "PAA3" }, ...],',
  '      "evidence_ids": ["PAA3", "R5", ...],',
  '      "weight": integer 0-100',
  '    }',
  '  ],',
  '  "unclustered_questions": ["any raw question worth keeping that didn\'t fit a cluster"],',
  '  "notes": "one-line note if evidence was thin or skewed, else empty string"',
  '}',
  '',
  'Cluster `weight` is the % of total evidence supporting this cluster; weights across clusters should roughly sum to 100.',
].join('\n');

function buildUserPrompt({ keyword, location, language, industry, paa, sourceBlocks }) {
  const lines = [
    `KEYWORD: ${keyword}`,
    `LOCATION: ${location}`,
    `LANGUAGE: ${language}`,
    industry ? `INDUSTRY CONTEXT: ${industry}` : '',
    '',
    'EVIDENCE BLOCKS (cite items using the [ID] tags):',
    '',
    buildPaaBlock(paa),
    ...sourceBlocks,
    '',
    'Return only the JSON object as specified.',
  ];
  return lines.filter((l) => l !== '').join('\n');
}

// ---------- weight normalization ----------

function normalizeClusterWeights(parsed) {
  if (!parsed || !Array.isArray(parsed.clusters) || !parsed.clusters.length) return parsed;
  const total = parsed.clusters.reduce((s, c) => s + (Number(c.weight) || 0), 0);
  if (total > 0 && Math.abs(total - 100) > 5) {
    parsed.clusters = parsed.clusters.map((c) => ({
      ...c,
      weight: Math.round((Number(c.weight) || 0) * 100 / total),
    }));
  }
  // Sort by weight desc so the renderer doesn't have to.
  parsed.clusters.sort((a, b) => (Number(b.weight) || 0) - (Number(a.weight) || 0));
  return parsed;
}

// ---------- citation lookup ----------

// Builds the lookup the renderer uses to turn [PAA3] / [R5] back into a clickable URL.
function buildCitationMap(paa, exaBundles) {
  const map = {};
  paa.forEach((q, i) => {
    map[`PAA${i + 1}`] = {
      kind: 'paa',
      label: q.question,
      url: q.source_url || '',
      domain: q.source_domain || '',
    };
  });
  for (const { source, results } of exaBundles) {
    const prefix = source[0].toUpperCase();
    results.slice(0, 12).forEach((it, i) => {
      map[`${prefix}${i + 1}`] = {
        kind: source,
        label: it.title || '',
        url: it.url || '',
        domain: it.url ? safeHost(it.url) : '',
      };
    });
  }
  return map;
}

function safeHost(url) {
  try { return new URL(url).host.replace(/^www\./, ''); } catch { return ''; }
}

// ---------- handler ----------

async function handle(req, res) {
  const rawBody = req.body || {};

  if (rawBody.test === true || (rawBody.body && rawBody.body.test === true)) {
    return res.json({
      ok: true,
      message: 'Question Research webhook reachable',
      received_at: new Date().toISOString(),
    });
  }

  const inputs = normalizeInput(rawBody);

  if (!inputs.keyword) {
    return res.status(400).json({ error: 'A keyword is required.' });
  }
  if (inputs.sources.length === 0) {
    return res.status(400).json({ error: 'At least one community source must be enabled (reddit / quora / forums / youtube).' });
  }

  // Stage 1: fire PAA + every Exa lane in parallel. Wall-clock = max(lane),
  // not sum. Lanes that error out come back empty and the run continues —
  // partial signal still produces useful clusters.
  const paaPromise = fetchPaa(inputs.keyword, inputs.location, inputs.language, inputs.device).catch(() => []);
  const exaPromises = inputs.sources.map((s) => fetchSource(s, inputs.keyword));

  const [paa, ...exaBundles] = await Promise.all([paaPromise, ...exaPromises]);

  const totalEvidence = paa.length + exaBundles.reduce((s, b) => s + (b.results ? b.results.length : 0), 0);
  if (totalEvidence === 0) {
    return res.status(200).json({
      request: { keyword: inputs.keyword, location: inputs.location, language: inputs.language, sources: inputs.sources },
      summary: 'No evidence returned by any source. Try a broader keyword or check API connectivity.',
      clusters: [],
      unclustered_questions: [],
      paa: [],
      source_counts: exaBundles.map((b) => ({ source: b.source, count: 0, error: b.error || null })),
      citations: {},
      generated_at: new Date().toISOString(),
    });
  }

  // Stage 2: pack evidence into per-source blocks the LLM can cite.
  const sourceBlocks = exaBundles.map((b) => buildEvidenceBlock(b.source, b.results)).filter(Boolean);

  // Stage 3: LLM clustering.
  const llmResponse = await chat({
    model: LLM_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt({
        keyword: inputs.keyword,
        location: inputs.location,
        language: inputs.language,
        industry: inputs.industry,
        paa,
        sourceBlocks,
      }) },
    ],
    temperature: 0.3,
    responseFormat: 'json_object',
    timeoutMs: 90000,
    title: 'On-Page SEO :: Question Research',
  });

  const parsed = parseChatJson(llmResponse);
  if (parsed.error) {
    return res.status(502).json({
      error: parsed.error,
      raw_text: parsed.raw_text || null,
      raw: parsed.raw || null,
    });
  }

  const normalized = normalizeClusterWeights(parsed.json || {});
  normalized.keyword = normalized.keyword || inputs.keyword;

  // Stage 4: attach citation lookup + source counts so the UI can hyperlink.
  const citations = buildCitationMap(paa, exaBundles);
  const source_counts = exaBundles.map((b) => ({
    source: b.source,
    count: b.results ? b.results.length : 0,
    error: b.error || null,
  }));

  return res.json({
    request: {
      keyword: inputs.keyword,
      location: inputs.location,
      language: inputs.language,
      device: inputs.device,
      industry: inputs.industry,
      sources: inputs.sources,
    },
    summary: normalized.summary || '',
    clusters: Array.isArray(normalized.clusters) ? normalized.clusters : [],
    unclustered_questions: Array.isArray(normalized.unclustered_questions) ? normalized.unclustered_questions : [],
    notes: normalized.notes || '',
    paa,
    source_counts,
    citations,
    generated_at: new Date().toISOString(),
  });
}

module.exports = { handle };

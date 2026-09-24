// SERP Analysis handler — two-step flow:
//
//   POST /webhook/serp-analysis-search
//     Input:  { keyword, location, language, device, depth? }
//     Output: { results: [{position, title, url, domain, description}, ...],
//               features: { paa, related_searches, ai_overview, ... },
//               request, generated_at }
//
//   POST /webhook/serp-analysis-analyze
//     Input:  { keyword, your_url, urls: [...selected competitor URLs],
//               location, language }
//     Output: { keyword, your_url, your_page, competitors[], common_patterns,
//               your_strengths, gaps, standout_signals, recommendations,
//               meta_comparison, sources, stats, ai_model, generated_at }
//
// Step 1 just talks to DataForSEO so the picker UI shows ~30 organic listings
// the user can hand-select from. Step 2 Firecrawl-scrapes every selected URL
// (plus your_url) in parallel, extracts on-page signals, then asks Gemini
// 2.5 Pro to surface common ranking signals, what the user's page already has,
// and what's missing.

const { dfsPost } = require('../util/dataforseo');
const { scrape } = require('../util/firecrawl');
const { chat, parseChatJson } = require('../util/openrouter');

const AI_MODEL = 'google/gemini-2.5-pro';
const MAX_ANALYZE_URLS = 12; // cap competitors so wall-clock stays bounded

// ---------- shared input normalization ----------

function getBody(rawBody) {
  return (rawBody && typeof rawBody.body === 'object' && rawBody.body !== null) ? rawBody.body : (rawBody || {});
}

function isTestPing(rawBody) {
  return rawBody.test === true || (rawBody.body && rawBody.body.test === true);
}

// ---------- STEP 1: SERP SEARCH ----------

function normalizeSearchInput(rawBody) {
  const body = getBody(rawBody);
  let depth = Number(body.depth);
  if (!Number.isFinite(depth)) depth = 30;
  depth = Math.min(Math.max(depth, 10), 50);
  return {
    keyword: String(body.keyword || '').trim(),
    location: String(body.location || 'United States').trim(),
    language: String(body.language || 'en').trim(),
    device: String(body.device || 'desktop').trim(),
    depth,
    requested_at: body.requested_at || new Date().toISOString(),
  };
}

function pruneSerpForPicker(taskResult, depth) {
  if (!taskResult) return { organic: [], features: {} };
  const items = taskResult.items || [];

  const organic = items
    .filter((i) => i.type === 'organic')
    .slice(0, depth)
    .map((r) => ({
      position: r.rank_absolute,
      title: r.title,
      url: r.url,
      description: r.description,
      domain: r.domain,
      breadcrumb: r.breadcrumb || '',
    }));

  const paaItem = items.find((i) => i.type === 'people_also_ask');
  const paa = paaItem ? (paaItem.items || []).slice(0, 8).map((q) => q.title).filter(Boolean) : [];
  const relatedItem = items.find((i) => i.type === 'related_searches');
  const related = relatedItem ? (relatedItem.items || []).slice(0, 10) : [];
  const featured = items.find((i) => i.type === 'featured_snippet') || null;
  const aiOverview = items.find((i) => i.type === 'ai_overview') || null;
  const knowledgeGraph = items.find((i) => i.type === 'knowledge_graph') || null;
  const videoPack = items.find((i) => i.type === 'video') || items.find((i) => i.type === 'videos');
  const imagePack = items.find((i) => i.type === 'images');
  const shopping = items.find((i) => i.type === 'shopping');
  const localPack = items.find((i) => i.type === 'local_pack');

  return {
    organic,
    features: {
      people_also_ask: paa,
      related_searches: related,
      featured_snippet: featured ? { title: featured.title, description: featured.description, url: featured.url } : null,
      ai_overview: aiOverview ? { present: true } : null,
      knowledge_graph: knowledgeGraph ? { title: knowledgeGraph.title, description: knowledgeGraph.description } : null,
      video_pack_present: !!videoPack,
      image_pack_present: !!imagePack,
      shopping_pack_present: !!shopping,
      local_pack_present: !!localPack,
    },
  };
}

async function handleSearch(req, res) {
  const rawBody = req.body || {};

  if (isTestPing(rawBody)) {
    return res.json({ ok: true, message: 'SERP Analysis (search) webhook reachable', received_at: new Date().toISOString() });
  }

  const inputs = normalizeSearchInput(rawBody);
  if (!inputs.keyword) return res.status(400).json({ error: 'keyword is required' });
  if (!inputs.location) return res.status(400).json({ error: 'location is required' });

  const serpResp = await dfsPost('/serp/google/organic/live/advanced', [{
    keyword: inputs.keyword,
    location_name: inputs.location,
    language_code: inputs.language,
    device: inputs.device,
    depth: inputs.depth,
  }], { timeoutMs: 60000 });

  const taskResult = serpResp && serpResp.tasks && serpResp.tasks[0] && serpResp.tasks[0].result && serpResp.tasks[0].result[0];
  if (!taskResult) {
    return res.status(502).json({
      error: 'No SERP result from DataForSEO',
      detail: serpResp && (serpResp.status_message || serpResp.tasks),
    });
  }

  const { organic, features } = pruneSerpForPicker(taskResult, inputs.depth);

  return res.json({
    results: organic,
    features,
    request: {
      keyword: inputs.keyword,
      location: inputs.location,
      language: inputs.language,
      device: inputs.device,
      depth: inputs.depth,
    },
    generated_at: new Date().toISOString(),
  });
}

// ---------- STEP 2: ANALYZE ----------

function normalizeAnalyzeInput(rawBody) {
  const body = getBody(rawBody);
  let urls = [];
  if (Array.isArray(body.urls)) urls = body.urls.map((u) => String(u).trim()).filter(Boolean);
  urls = [...new Set(urls)].slice(0, MAX_ANALYZE_URLS);
  return {
    keyword: String(body.keyword || '').trim(),
    your_url: String(body.your_url || '').trim(),
    urls,
    location: String(body.location || 'United States').trim(),
    language: String(body.language || 'en').trim(),
    paa: Array.isArray(body.paa) ? body.paa.map(String).slice(0, 8) : [],
    related_searches: Array.isArray(body.related_searches) ? body.related_searches.map(String).slice(0, 10) : [],
    requested_at: body.requested_at || new Date().toISOString(),
  };
}

// ---------- per-page signal extraction ----------

function getDomain(u) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; }
}

function decodeEntities(s) {
  return String(s || '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function stripMarkdown(md) {
  return String(md || '')
    .replace(/```[\s\S]*?```/g, ' ')             // fenced code
    .replace(/`[^`]*`/g, ' ')                    // inline code
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')        // images
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')      // links → text
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')          // heading marks
    .replace(/^[*+-]\s+/gm, '')                  // bullets
    .replace(/^\d+\.\s+/gm, '')                  // numbered
    .replace(/[*_~>]/g, ' ')                     // emphasis/quote marks
    .replace(/\|/g, ' ')                         // table pipes
    .replace(/\s+/g, ' ')
    .trim();
}

function parseHeadingsFromMarkdown(md) {
  const out = [];
  const re = /^(\s{0,3})(#{1,6})\s+(.+?)\s*#*\s*$/gm;
  let m;
  while ((m = re.exec(String(md || ''))) !== null) {
    const level = m[2].length;
    const text = m[3].replace(/[`*_~]/g, '').trim();
    if (text) out.push({ level, text });
  }
  return out;
}

function parseHeadingsFromHtml(html) {
  const out = [];
  const re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(String(html || ''))) !== null) {
    const text = decodeEntities(m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    if (text) out.push({ level: Number(m[1]), text });
  }
  return out;
}

function extractTagText(html, tag) {
  const re = new RegExp('<' + tag + '\\b[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 'i');
  const m = re.exec(String(html || ''));
  return m ? decodeEntities(m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()) : '';
}

function extractMetaDescription(html) {
  const re = /<meta\b[^>]*name=["']description["'][^>]*>/i;
  const tag = (re.exec(String(html || '')) || [])[0] || '';
  const c = /content=["']([^"']*)["']/i.exec(tag);
  return c ? decodeEntities(c[1]).trim() : '';
}

function extractSchemaTypes(html) {
  const out = new Set();
  const re = /"@type"\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(String(html || ''))) !== null) out.add(m[1]);
  // Microdata fallback
  const re2 = /itemtype=["']https?:\/\/schema\.org\/([^"']+)["']/g;
  while ((m = re2.exec(String(html || ''))) !== null) out.add(m[1]);
  return [...out];
}

function countMatches(s, re) {
  const m = String(s || '').match(re);
  return m ? m.length : 0;
}

function extractSignals(url, scraped) {
  const md = scraped.markdown || '';
  const html = scraped.html || '';
  const meta = scraped.metadata || {};

  const headings = parseHeadingsFromMarkdown(md);
  const htmlHeadings = headings.length ? headings : parseHeadingsFromHtml(html);

  const plain = stripMarkdown(md) || (html ? decodeEntities(html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()) : '');
  const wordCount = plain ? plain.split(/\s+/).filter(Boolean).length : 0;

  const domain = getDomain(url);
  const linkObjs = Array.isArray(scraped.links) ? scraped.links : [];
  let internalLinks = 0, externalLinks = 0;
  for (const l of linkObjs) {
    const d = getDomain(l);
    if (!d) continue;
    if (d === domain) internalLinks += 1; else externalLinks += 1;
  }

  const headingTexts = htmlHeadings.map((h) => h.text);
  const hasFaqHeading = headingTexts.some((t) => /faq|frequently asked|q&a/i.test(t)) || headingTexts.filter((t) => /\?$/.test(t)).length >= 3;

  const tablesMd = countMatches(md, /^\s*\|.*\|\s*$/gm);
  const tablesHtml = countMatches(html, /<table\b/gi);
  const tableCount = Math.max(tablesMd >= 2 ? Math.floor(tablesMd / 3) : 0, tablesHtml);

  const imageCount = countMatches(md, /!\[[^\]]*]\([^)]*\)/g) + countMatches(html, /<img\b/gi);
  const videoCount = countMatches(html, /<iframe\b[^>]*(youtube|vimeo|wistia|loom)/gi) + countMatches(html, /<video\b/gi);

  const bullets = countMatches(md, /^[*+-]\s+/gm);
  const numbered = countMatches(md, /^\d+\.\s+/gm);
  const listCount = bullets + numbered;

  const codeBlocks = countMatches(md, /```[\s\S]*?```/g);
  const blockquotes = countMatches(md, /^>\s+/gm);

  const schemaTypes = extractSchemaTypes(html);

  const title = (meta.title || meta.ogTitle || extractTagText(html, 'title') || '').trim();
  const metaDescription = (meta.description || meta.ogDescription || extractMetaDescription(html) || '').trim();
  const h1 = htmlHeadings.find((h) => h.level === 1);
  const h1Text = h1 ? h1.text : '';

  return {
    url,
    domain,
    source: scraped.source,
    error: scraped.error || null,
    title,
    h1: h1Text,
    meta_description: metaDescription,
    meta_description_length: metaDescription.length,
    title_length: title.length,
    word_count: wordCount,
    headings_outline: htmlHeadings.slice(0, 60),
    heading_counts: {
      h1: htmlHeadings.filter((h) => h.level === 1).length,
      h2: htmlHeadings.filter((h) => h.level === 2).length,
      h3: htmlHeadings.filter((h) => h.level === 3).length,
      h4: htmlHeadings.filter((h) => h.level === 4).length,
    },
    internal_links: internalLinks,
    external_links: externalLinks,
    image_count: imageCount,
    video_count: videoCount,
    table_count: tableCount,
    list_count: listCount,
    code_block_count: codeBlocks,
    blockquote_count: blockquotes,
    has_faq_section: hasFaqHeading,
    schema_types: schemaTypes,
    language: meta.language || meta.ogLocale || '',
  };
}

async function scrapeAndExtract(url) {
  try {
    const scraped = await scrape(url, { timeoutMs: 60000 });
    return extractSignals(url, scraped);
  } catch (e) {
    return {
      url,
      domain: getDomain(url),
      source: 'fallback',
      error: 'pipeline error: ' + (e && e.message ? e.message : String(e)),
      title: '',
      h1: '',
      meta_description: '',
      word_count: 0,
      headings_outline: [],
      heading_counts: { h1: 0, h2: 0, h3: 0, h4: 0 },
      internal_links: 0,
      external_links: 0,
      image_count: 0,
      video_count: 0,
      table_count: 0,
      list_count: 0,
      code_block_count: 0,
      blockquote_count: 0,
      has_faq_section: false,
      schema_types: [],
      language: '',
    };
  }
}

// ---------- aggregation helpers ----------

function median(arr) {
  const xs = arr.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!xs.length) return null;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[mid] : Math.round((xs[mid - 1] + xs[mid]) / 2);
}

function aggregateCompetitors(competitors) {
  const ok = competitors.filter((c) => !c.error);
  if (!ok.length) {
    return {
      pages_analyzed: 0,
      pages_failed: competitors.length,
      median_word_count: null,
      median_h2_count: null,
      median_internal_links: null,
      median_external_links: null,
      median_image_count: null,
      median_video_count: null,
      faq_section_share: 0,
      table_share: 0,
      schema_type_frequency: {},
    };
  }
  const schemaFreq = {};
  for (const c of ok) {
    for (const t of c.schema_types || []) schemaFreq[t] = (schemaFreq[t] || 0) + 1;
  }
  return {
    pages_analyzed: ok.length,
    pages_failed: competitors.length - ok.length,
    median_word_count: median(ok.map((c) => c.word_count)),
    median_h2_count: median(ok.map((c) => c.heading_counts.h2)),
    median_internal_links: median(ok.map((c) => c.internal_links)),
    median_external_links: median(ok.map((c) => c.external_links)),
    median_image_count: median(ok.map((c) => c.image_count)),
    median_video_count: median(ok.map((c) => c.video_count)),
    faq_section_share: Math.round((ok.filter((c) => c.has_faq_section).length / ok.length) * 100),
    table_share: Math.round((ok.filter((c) => c.table_count > 0).length / ok.length) * 100),
    schema_type_frequency: schemaFreq,
  };
}

// Compact each page to just what the LLM needs, so we don't blow the context.
function compactForPrompt(p, isYou) {
  return {
    label: isYou ? 'YOUR_PAGE' : ('COMPETITOR'),
    url: p.url,
    domain: p.domain,
    title: p.title,
    title_length: p.title_length,
    h1: p.h1,
    meta_description: p.meta_description,
    meta_description_length: p.meta_description_length,
    word_count: p.word_count,
    heading_counts: p.heading_counts,
    headings_outline: (p.headings_outline || []).slice(0, 40).map((h) => '  '.repeat(Math.max(0, h.level - 1)) + 'H' + h.level + ': ' + h.text),
    internal_links: p.internal_links,
    external_links: p.external_links,
    image_count: p.image_count,
    video_count: p.video_count,
    table_count: p.table_count,
    list_count: p.list_count,
    has_faq_section: p.has_faq_section,
    schema_types: p.schema_types,
    error: p.error || undefined,
  };
}

// ---------- LLM prompts ----------

const SYSTEM_PROMPT = [
  "You are a senior SEO analyst doing a competitive SERP teardown. The user is trying to rank a specific page (YOUR_PAGE) for a target keyword and has given you the top SERP competitors they want benchmarked against. Your job: surface what the top rankers have in common, identify what the user's page already does well, and call out the concrete gaps the user must close.",
  '',
  'GROUNDING RULES (non-negotiable):',
  '1. Use only what is in the <data> blocks. Do not invent headings, schema types, word counts, or features that are not in the signals.',
  '2. "Common patterns" = signals that appear on AT LEAST 60% of the competitors AND that meaningfully differentiate top rankers from average pages. Examples: presence of a comparison table, FAQ section with PAA-style questions, specific schema types (FAQPage, HowTo, Product), specific recurring H2 themes, average word count band, presence of original imagery/diagrams.',
  '3. "Gaps" = something present in the majority of competitors and absent (or weak) in YOUR_PAGE. Each gap MUST cite at least one competitor URL as evidence. Sort by impact (P0 first).',
  '4. "Strengths" = something YOUR_PAGE already does that the majority of competitors also do. Acknowledge what is working before piling on fixes.',
  '5. "Standout signals" = noteworthy things that 1-2 top rankers do that others do NOT, that could explain why they rank higher. Frame these as "experiments to consider", not as required actions.',
  '6. "Recommendations" = concrete actions, prioritized P0/P1/P2. Every P0 must trace back to a gap. Be specific: "Add an FAQ section with at least 4 of these PAA questions: ..." beats "Add an FAQ section".',
  '7. Title + meta comparison: propose a rewritten title and meta description for YOUR_PAGE that incorporates the keyword as competitors do, respects character limits (title ~55-60, meta ~150-160), and matches the SERP intent. Only suggest if there is a clear improvement; otherwise return the existing title/meta and set their "needs_change" to false.',
  '8. Be honest. If the analyzed set is too small or the user\'s page already covers everything, say so in the summary and keep gaps short.',
  '',
  'OUTPUT: valid JSON only. No markdown fences, no prose outside JSON. Schema EXACTLY:',
  '{',
  '  "summary": "2-3 sentence positioning: what the SERP rewards + how YOUR_PAGE stacks up overall",',
  '  "serp_archetype": "How-to article | Listicle | Comparison | Review | Product page | Service page | Glossary | Local landing | Homepage | Other",',
  '  "common_patterns": [ { "pattern": "short label", "detail": "1-2 sentences", "frequency": "X of N competitors", "evidence_urls": ["..."] } ],',
  '  "your_strengths": [ { "strength": "short label", "detail": "1 sentence" } ],',
  '  "gaps": [ { "area": "short label", "detail": "what is missing or weak on YOUR_PAGE", "severity": "P0|P1|P2", "evidence_urls": ["..."], "competitor_examples": ["1 short phrase from each evidence URL showing how they handle it"] } ],',
  '  "standout_signals": [ { "signal": "short label", "detail": "1-2 sentences", "seen_on": ["..."] } ],',
  '  "recommendations": [ { "priority": "P0|P1|P2", "action": "imperative sentence telling user exactly what to do", "why": "1 sentence tying to gap or pattern", "linked_gap": "matching gaps[].area or null" } ],',
  '  "meta_comparison": {',
  '    "your_title": "...", "your_title_length": N,',
  '    "suggested_title": "...", "title_needs_change": true|false,',
  '    "your_meta_description": "...", "your_meta_description_length": N,',
  '    "suggested_meta_description": "...", "meta_needs_change": true|false',
  '  },',
  '  "content_depth_verdict": "ahead | on par | behind",',
  '  "target_word_count": "X-Y words (anchored to competitor median ± 15%)"',
  '}',
].join('\n');

function buildUserPrompt({ keyword, location, language, yourPage, competitors, aggregate, paa, related }) {
  const lines = [
    'TARGET KEYWORD: ' + keyword,
    'LOCATION: ' + location,
    'LANGUAGE: ' + language,
    '',
    '<data label="AGGREGATE_SIGNALS">',
    JSON.stringify(aggregate, null, 2),
    '</data>',
    '',
    '<data label="YOUR_PAGE">',
    JSON.stringify(compactForPrompt(yourPage, true), null, 2),
    '</data>',
    '',
    '<data label="COMPETITORS">',
    JSON.stringify(competitors.map((c) => compactForPrompt(c, false)), null, 2),
    '</data>',
  ];
  if (paa && paa.length) {
    lines.push('', '<data label="PEOPLE_ALSO_ASK">', paa.map((p) => '- ' + p).join('\n'), '</data>');
  }
  if (related && related.length) {
    lines.push('', '<data label="RELATED_SEARCHES">', related.map((p) => '- ' + p).join('\n'), '</data>');
  }
  lines.push('', 'Return the analysis as JSON exactly matching the schema in the system prompt.');
  return lines.join('\n');
}

async function handleAnalyze(req, res) {
  const rawBody = req.body || {};

  if (isTestPing(rawBody)) {
    return res.json({ ok: true, message: 'SERP Analysis (analyze) webhook reachable', received_at: new Date().toISOString() });
  }

  const inputs = normalizeAnalyzeInput(rawBody);
  if (!inputs.keyword) return res.status(400).json({ error: 'keyword is required' });
  if (!inputs.your_url) return res.status(400).json({ error: 'your_url is required' });
  const yourUrlCoerced = /^https?:\/\//i.test(inputs.your_url) ? inputs.your_url : 'https://' + inputs.your_url;
  try { new URL(yourUrlCoerced); }
  catch { return res.status(400).json({ error: 'your_url is not a valid URL (received: ' + JSON.stringify(inputs.your_url) + ')' }); }
  inputs.your_url = yourUrlCoerced;
  inputs.urls = inputs.urls.map((u) => /^https?:\/\//i.test(u) ? u : 'https://' + u);
  if (!inputs.urls.length) return res.status(400).json({ error: 'at least 1 competitor URL is required' });
  if (inputs.urls.length > MAX_ANALYZE_URLS) {
    return res.status(400).json({ error: 'Maximum ' + MAX_ANALYZE_URLS + ' competitor URLs per analysis (received ' + inputs.urls.length + ').' });
  }

  // Stage 1: scrape YOUR_PAGE + all competitor URLs in parallel.
  // Firecrawl pages cost the most wall-clock time here; parallel keeps total
  // latency at ~max(per-page) instead of N × per-page.
  const all = [inputs.your_url, ...inputs.urls];
  const settled = await Promise.allSettled(all.map(scrapeAndExtract));
  const extracted = settled.map((s, i) => {
    if (s.status === 'fulfilled') return s.value;
    return {
      url: all[i], domain: getDomain(all[i]), source: 'fallback',
      error: 'pipeline error: ' + (s.reason && s.reason.message ? s.reason.message : String(s.reason)),
      title: '', h1: '', meta_description: '', word_count: 0,
      headings_outline: [], heading_counts: { h1: 0, h2: 0, h3: 0, h4: 0 },
      internal_links: 0, external_links: 0, image_count: 0, video_count: 0,
      table_count: 0, list_count: 0, code_block_count: 0, blockquote_count: 0,
      has_faq_section: false, schema_types: [], language: '',
    };
  });

  const yourPage = extracted[0];
  const competitors = extracted.slice(1);
  const aggregate = aggregateCompetitors(competitors);

  // Stage 2: LLM.
  const userPrompt = buildUserPrompt({
    keyword: inputs.keyword,
    location: inputs.location,
    language: inputs.language,
    yourPage,
    competitors,
    aggregate,
    paa: inputs.paa,
    related: inputs.related_searches,
  });

  let aiError = null;
  let analysis = {
    summary: '',
    serp_archetype: '',
    common_patterns: [],
    your_strengths: [],
    gaps: [],
    standout_signals: [],
    recommendations: [],
    meta_comparison: {
      your_title: yourPage.title || '',
      your_title_length: yourPage.title_length || 0,
      suggested_title: '',
      title_needs_change: false,
      your_meta_description: yourPage.meta_description || '',
      your_meta_description_length: yourPage.meta_description_length || 0,
      suggested_meta_description: '',
      meta_needs_change: false,
    },
    content_depth_verdict: '',
    target_word_count: aggregate.median_word_count
      ? Math.round(aggregate.median_word_count * 0.85) + '-' + Math.round(aggregate.median_word_count * 1.15) + ' words (anchored to competitor median)'
      : '',
  };

  const llmResp = await chat({
    model: AI_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.25,
    responseFormat: 'json_object',
    timeoutMs: 120000,
    title: 'On-Page SEO :: SERP Analysis',
  });

  const parsed = parseChatJson(llmResp);
  if (parsed.error) {
    aiError = parsed.error;
    if (parsed.raw_text) analysis.raw_text = parsed.raw_text;
  } else {
    analysis = { ...analysis, ...parsed.json };
  }

  const result = {
    keyword: inputs.keyword,
    your_url: inputs.your_url,
    location: inputs.location,
    language: inputs.language,
    your_page: yourPage,
    competitors,
    aggregate,
    ...analysis,
    ai_model: AI_MODEL,
    generated_at: new Date().toISOString(),
  };
  if (aiError) result.ai_error = aiError;

  return res.json(result);
}

module.exports = { handleSearch, handleAnalyze };

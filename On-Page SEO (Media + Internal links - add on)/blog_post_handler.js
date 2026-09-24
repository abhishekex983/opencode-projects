// Blog Post Creation handlers — outline generation + content expansion for blog
// posts. Two endpoints in one module:
//   - handleOutline: POST /webhook/blog-post-outline
//   - handleContent: POST /webhook/blog-post-content
//
// Same request/response shape pattern as content-optimizer.js so the dashboard
// only needs URL swaps.

const { chat, parseChatJson } = require('../util/openrouter');
const exa = require('../util/exa');

const OUTLINE_MODEL = 'anthropic/claude-sonnet-4.5';
const CONTENT_MODEL = 'anthropic/claude-sonnet-4.5';
const STATS_SUMMARY_MODEL = 'google/gemini-2.5-flash';

// ---------- shared input normalization ----------

function pickFromForm(form, ...keys) {
  for (const k of keys) {
    if (form[k] !== undefined && form[k] !== null && form[k] !== '') return form[k];
  }
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  const targets = keys.map(norm);
  for (const k of Object.keys(form)) {
    const n = norm(k);
    if (targets.some((t) => n === t || n.startsWith(t))) return form[k];
  }
  return '';
}

function toArr(v) {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  return [];
}

function unwrapBody(rawBody) {
  return (rawBody && typeof rawBody.body === 'object' && rawBody.body !== null && Object.keys(rawBody.body).length > 0)
    ? rawBody.body
    : (rawBody || {});
}

function parseBool(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1';
  if (typeof v === 'number') return v !== 0;
  return false;
}

function normalizeOutlineInput(rawBody) {
  const form = unwrapBody(rawBody);
  const p = (...k) => pickFromForm(form, ...k);
  return {
    topic: p('topic', 'Topic') || '',
    voice: p('voice', 'Voice') || '',
    anecdotes: p('anecdotes', 'Anecdotes') || '',
    opinions: p('opinions', 'Opinions') || '',
    stats_enabled: parseBool(p('stats_enabled', 'Stats Enabled', 'statsEnabled')),
    focus_keyword: p('focus_keyword', 'Focus Keyword', 'focusKeyword') || '',
    header_keywords: toArr(p('header_keywords', 'Header Keywords', 'headerKeywords')),
    entities: toArr(p('entities', 'Entities')),
    common_keywords: toArr(p('common_keywords', 'Common Keywords', 'commonKeywords')),
    extra_keywords: toArr(p('extra_keywords', 'Extra Keywords', 'extraKeywords')),
    intent_context_text: String(p('intent_context_text', 'intentContextText') || '').trim(),
    salience_context_text: String(p('salience_context_text', 'salienceContextText') || '').trim(),
    audience_context_text: String(p('audience_context_text', 'audienceContextText') || '').trim(),
  };
}

function normalizeContentInput(rawBody) {
  const form = unwrapBody(rawBody);
  const p = (...k) => pickFromForm(form, ...k);
  return {
    edited_outline: p('edited_outline', 'outline', 'editedOutline') || '',
    focus_keyword: p('focus_keyword', 'Focus Keyword', 'focusKeyword') || '',
    header_keywords: toArr(p('header_keywords', 'Header Keywords', 'headerKeywords')),
    entities: toArr(p('entities', 'Entities')),
    common_keywords: toArr(p('common_keywords', 'Common Keywords', 'commonKeywords')),
    extra_keywords: toArr(p('extra_keywords', 'Extra Keywords', 'extraKeywords')),
    intent_context_text: String(p('intent_context_text', 'intentContextText') || '').trim(),
    salience_context_text: String(p('salience_context_text', 'salienceContextText') || '').trim(),
    audience_context_text: String(p('audience_context_text', 'audienceContextText') || '').trim(),
  };
}

// ---------- stats scraping pipeline ----------

async function fetchStats(topic, focusKeyword) {
  const query = (topic || focusKeyword).trim();
  if (!query) return { stats_block: '', source_count: 0, error: 'No topic or focus keyword to search for stats.' };

  try {
    const searchOpts = {
      query: query + ' statistics data study research',
      numResults: 8,
      timeoutMs: 30000,
      source: 'stats',
    };

    const result = await exa.searchAndContents(searchOpts);
    if (!result || result.error || !Array.isArray(result.results) || result.results.length === 0) {
      return { stats_block: '', source_count: 0, error: result.error || 'No statistical sources found for this topic.' };
    }

    const texts = [];
    let sourceCount = 0;
    for (const r of result.results) {
      const body = (r.text || '').trim();
      if (body.length > 100) {
        texts.push('[Source: ' + (r.title || r.url || 'unknown') + ']\n' + body);
        sourceCount++;
      }
      if (sourceCount >= 5) break;
    }

    if (texts.length === 0) {
      return { stats_block: '', source_count: 0, error: 'Exa results had insufficient text content.' };
    }

    const combined = texts.join('\n\n---\n\n');
    const summaryResp = await chat({
      model: STATS_SUMMARY_MODEL,
      messages: [{
        role: 'system',
        content: 'You are a research assistant. Extract relevant statistics, data points, percentages, study findings, and research results from the provided sources. Output a concise bullet-point list. Include the specific numbers and cite the source name in brackets. Format: "- [statistic] [source name]". If a source has no concrete data, skip it. Output only the bullet list, no preamble.',
      }, {
        role: 'user',
        content: 'Extract all statistics, data points, and research findings from the following sources about "' + query + '". Return only the bullet-point list:\n\n' + combined,
      }],
      temperature: 0,
      responseFormat: null,
      timeoutMs: 60000,
      title: 'Blog Post Creation :: Stats Summary',
    });

    let statsBlock = '';
    if (summaryResp && summaryResp.choices && summaryResp.choices[0] && summaryResp.choices[0].message) {
      statsBlock = (summaryResp.choices[0].message.content || '').trim();
    }

    return { stats_block: statsBlock, source_count: sourceCount, error: null };
  } catch (err) {
    return { stats_block: '', source_count: 0, error: 'Stats scraping failed: ' + (err.message || String(err)) };
  }
}

// ---------- prompts ----------

const OUTLINE_SYSTEM_PROMPT = 'You are a senior blog editor and SEO strategist. You write blog-post outlines that rank in Google AND are quoted by LLM-based search (ChatGPT, Gemini, Perplexity).\n\nGROUNDING RULES:\n1. Design the blog structure yourself. Choose the best H1 title, section headings, and flow based on the topic, voice, anecdotes, opinions, stats, and keyword context provided. Do NOT follow a fixed template — let the content dictate the structure.\n2. The H1 must include the Focus Keyword naturally. It should read like a compelling blog title, not a keyword-stuffed headline.\n3. Every section body must be one or two short lines describing what the writer should cover in that section, citing which keywords / entities / anecdotes / stats to weave in. Do NOT write the actual paragraph content here — outlines only.\n4. Weave keywords naturally: Focus Keyword in the H1 and intro, Header Keywords in H2/H3 headings, Entities where they add authority, Common/Extra Keywords throughout body descriptions.\n5. If <voice_context> is provided, write all section descriptions in that exact voice — mirror the tone, style, perspective, and audience level described. The outline itself should read as if written by that voice.\n6. If <anecdotes> are provided, place each anecdote in the most relevant section — tag it as [Include anecdote: <summary>] in the section body.\n7. If <opinions> are provided, ensure at least 1-2 sections explicitly call out the unique/contrarian takes. Tag them as [POV: <summary>].\n8. If <stats_context> is provided (statistics and data points from live research), weave the most relevant stats into appropriate sections. Tag them as [Include stat: <summary>]. Do not fabricate new stats from thin air.\n9. SEARCH INTENT INSIGHTS: If <intent_context> contains content, treat it as authoritative truth about what users searching this topic actually want. Shape the outline to address the stated primary intent. Use sub-intents to inspire section topics. Honor any recommended page archetype. If a modifier-SERP conflict is flagged, follow that guidance.\n10. SALIENCE INSIGHTS: If <salience_context> contains content (must-cover entities, H2 candidates, supporting topics), integrate the must-cover entities into appropriate sections. Use H2 candidate phrasings where they fit the blog flow.\n11. AUDIENCE RESEARCH: If <audience_context> contains content (problem clusters with questions and content angles), use the user problems as primary inspiration for section topics. Address the top emotional/practical concerns early, not buried deep. Use representative questions as FAQ section prompts if the outline format warrants an FAQ.\n\nTONE: Match the provided voice exactly. If no voice is provided, default to conversational, authoritative, and benefit-driven.\n\nOUTPUT: Plain markdown. No preamble. No trailing commentary. No code fences.';

function buildOutlineUserPrompt(form, statsResult) {
  const parts = [];

  parts.push('<topic>\n' + (form.topic || form.focus_keyword || '(not set)') + '\n</topic>');

  if (form.voice) {
    parts.push('<voice_context>\n' + form.voice + '\n</voice_context>');
  }

  if (form.anecdotes) {
    parts.push('<anecdotes>\n' + form.anecdotes + '\n</anecdotes>');
  }

  if (form.opinions) {
    parts.push('<opinions>\n' + form.opinions + '\n</opinions>');
  }

  if (statsResult && statsResult.stats_block) {
    parts.push('<stats_context>\n' + statsResult.stats_block + '\n</stats_context>');
  }

  parts.push('<marketer_inputs>\nFocus Keyword: ' + (form.focus_keyword || '(not set)') + '\nHeader Keywords: ' + ((form.header_keywords || []).join(', ') || '(not set)') + '\nEntities: ' + ((form.entities || []).join(', ') || '(not set)') + '\nCommon Keywords: ' + ((form.common_keywords || []).join(', ') || '(not set)') + '\nExtra Keywords: ' + ((form.extra_keywords || []).join(', ') || '(not set)') + '\n</marketer_inputs>');

  parts.push('<intent_context>\n' + (form.intent_context_text || '(not provided)') + '\n</intent_context>');
  parts.push('<salience_context>\n' + (form.salience_context_text || '(not provided)') + '\n</salience_context>');
  parts.push('<audience_context>\n' + (form.audience_context_text || '(not provided)') + '\n</audience_context>');
  parts.push('Now produce the blog-post outline.');

  return parts.join('\n\n');
}

const CONTENT_SYSTEM_PROMPT = 'You are a senior blog editor and SEO copywriter. You write blog-post content that ranks in Google AND is quoted by LLM-based search.\n\nGROUNDING RULES:\n1. Expand every section of the provided outline into final blog copy. Do NOT add, remove, or reorder sections unless the outline explicitly signals flexibility.\n2. Under every heading, write engaging, authentic prose. H2s get 2-4 paragraphs. H3s get 1-2 paragraphs. The intro hook should grab attention in the first sentence — use a stat, a provocative statement, or a vivid anecdote as appropriate.\n3. Naturally weave in the Focus Keyword, Header Keywords, Entities, and Common Keywords. Use the Focus Keyword in the H1 and once in the opening paragraph. Use Entities where they add trust signals. Do not keyword-stuff.\n4. If the outline contains [Include anecdote: ...] tags, expand the anecdote into full narrative prose in that section. Make it personal and vivid.\n5. If the outline contains [POV: ...] tags, expand the opinion into a clear, confident position statement with supporting reasoning.\n6. If the outline contains [Include stat: ...] tags, present the statistic naturally with proper attribution — "According to [source], ..." or similar phrasing. Do not fabricate stats not present in the outline tags.\n7. If <voice_context> was provided, the entire post must read in that voice — every sentence, every transition, every takeaway. The voice is non-negotiable.\n8. For any [TO FILL] markers in the outline, leave a [TO FILL: <label>] placeholder instead of fabricating.\n9. SEARCH INTENT INSIGHTS: If <intent_context> contains content, calibrate tone, depth, and CTAs to the stated primary intent. Transactional -> buy/subscribe CTAs. Informational -> no heavy sell, focus on teaching. If a modifier-SERP conflict is flagged, follow that guidance.\n10. SALIENCE INSIGHTS: If <salience_context> contains content, weave must-cover entities naturally throughout the body copy using exact entity names.\n11. AUDIENCE RESEARCH: If <audience_context> contains content, address the top user problems explicitly. Use the phrasing patterns from representative questions to write relatable copy.\n\nFORMAT: Pure markdown. Preserve H1/H2/H3 structure exactly. No preamble, no trailing commentary, no code fences.\n\nTONE: Match the provided voice exactly. If no voice provided, default to conversational, authoritative, and benefit-driven. Short sentences. No filler phrases ("in today\'s world", "in conclusion", etc.).';

function buildContentUserPrompt(form) {
  const parts = [];

  parts.push('<marketer_inputs>\nFocus Keyword: ' + (form.focus_keyword || '(not set)') + '\nHeader Keywords: ' + ((form.header_keywords || []).join(', ') || '(not set)') + '\nEntities: ' + ((form.entities || []).join(', ') || '(not set)') + '\nCommon Keywords: ' + ((form.common_keywords || []).join(', ') || '(not set)') + '\nExtra Keywords: ' + ((form.extra_keywords || []).join(', ') || '(not set)') + '\n</marketer_inputs>');

  parts.push('<intent_context>\n' + (form.intent_context_text || '(not provided)') + '\n</intent_context>');
  parts.push('<salience_context>\n' + (form.salience_context_text || '(not provided)') + '\n</salience_context>');
  parts.push('<audience_context>\n' + (form.audience_context_text || '(not provided)') + '\n</audience_context>');

  parts.push('<edited_outline>\n' + form.edited_outline + '\n</edited_outline>');
  parts.push('Now expand the outline into final blog-post content.');

  return parts.join('\n\n');
}

// ---------- markdown cleanup ----------

function stripFences(md) {
  return md.replace(/^```(?:markdown|md)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}

// ---------- outline handler ----------

async function handleOutline(req, res) {
  const rawBody = req.body || {};

  if (rawBody.test === true || (rawBody.body && rawBody.body.test === true)) {
    return res.json({
      ok: true,
      message: 'Webhook reachable',
      received_at: new Date().toISOString(),
    });
  }

  const form = normalizeOutlineInput(rawBody);

  if (!form.topic && !form.focus_keyword) {
    return res.json({ error: 'Topic or Focus Keyword is required.' });
  }

  // Stage 1: fetch stats if enabled
  let statsResult = null;
  if (form.stats_enabled) {
    statsResult = await fetchStats(form.topic, form.focus_keyword);
  }

  // Stage 2: outline LLM call
  const resp = await chat({
    model: OUTLINE_MODEL,
    messages: [
      { role: 'system', content: OUTLINE_SYSTEM_PROMPT },
      { role: 'user', content: buildOutlineUserPrompt(form, statsResult) },
    ],
    temperature: 0.3,
    responseFormat: null,
    timeoutMs: 120000,
    title: 'Blog Post Creation :: Outline',
  });

  if (resp && resp._error) {
    return res.json({ error: 'OpenRouter request failed', detail: resp._error });
  }
  if (resp && resp.error) {
    return res.json({ error: 'OpenRouter returned error', detail: resp.error });
  }

  const outline = resp && resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content;
  if (!outline) {
    return res.json({ error: 'No outline in OpenRouter response', raw: resp });
  }

  const responsePayload = {
    request: {
      topic: form.topic,
      focus_keyword: form.focus_keyword,
      header_keywords: form.header_keywords,
      entities: form.entities,
      common_keywords: form.common_keywords,
      extra_keywords: form.extra_keywords,
    },
    outline: stripFences(outline),
    model: OUTLINE_MODEL,
    usage: resp.usage || null,
    generated_at: new Date().toISOString(),
  };

  if (statsResult) {
    responsePayload.stats = {
      enabled: true,
      source_count: statsResult.source_count,
      stats_block: statsResult.stats_block,
      error: statsResult.error || null,
    };
  }

  return res.json(responsePayload);
}

// ---------- content handler ----------

async function handleContent(req, res) {
  const rawBody = req.body || {};

  if (rawBody.test === true || (rawBody.body && rawBody.body.test === true)) {
    return res.json({
      ok: true,
      message: 'Webhook reachable',
      received_at: new Date().toISOString(),
    });
  }

  const form = normalizeContentInput(rawBody);

  if (!form.edited_outline) {
    return res.json({ error: 'edited_outline is required' });
  }

  const resp = await chat({
    model: CONTENT_MODEL,
    messages: [
      { role: 'system', content: CONTENT_SYSTEM_PROMPT },
      { role: 'user', content: buildContentUserPrompt(form) },
    ],
    temperature: 0.35,
    responseFormat: null,
    timeoutMs: 120000,
    title: 'Blog Post Creation :: Content',
  });

  if (resp && resp._error) {
    return res.json({ error: 'OpenRouter request failed', detail: resp._error });
  }
  if (resp && resp.error) {
    return res.json({ error: 'OpenRouter returned error', detail: resp.error });
  }

  const content = resp && resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content;
  if (!content) {
    return res.json({ error: 'No content in OpenRouter response', raw: resp });
  }

  const cleaned = stripFences(content);
  const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
  const h1Count = (cleaned.match(/^#\s+/gm) || []).length;
  const h2Count = (cleaned.match(/^##\s+/gm) || []).length;
  const h3Count = (cleaned.match(/^###\s+/gm) || []).length;

  return res.json({
    request: {
      focus_keyword: form.focus_keyword,
      header_keywords: form.header_keywords,
      entities: form.entities,
      common_keywords: form.common_keywords,
      extra_keywords: form.extra_keywords,
    },
    content: cleaned,
    model: CONTENT_MODEL,
    stats: { word_count: wordCount, h1: h1Count, h2: h2Count, h3: h3Count },
    usage: resp.usage || null,
    generated_at: new Date().toISOString(),
  });
}

module.exports = { handleOutline, handleContent };

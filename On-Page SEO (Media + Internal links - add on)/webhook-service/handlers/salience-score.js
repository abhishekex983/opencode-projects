// Salience Score handler — port of the n8n "Salience Score" workflow.
// Same request/response shape as the live n8n webhook so the dashboard
// only swaps the URL.

const { analyzeEntities } = require('../util/nlp');
const { chat, parseChatJson } = require('../util/openrouter');

const AI_MODEL = 'google/gemini-2.5-pro';

const STOP = new Set(
  ('a an and or but if then else for of in to with on at by from as is are was were be been being have has had do does did can could should would will may might must this that these those it its their them they we us our you your he she his her i me my him not no so too very just also more most some any all each every other').split(/\s+/)
);

// ---------- input ----------

function normalizeInput(rawBody) {
  const body = (rawBody && typeof rawBody.body === 'object' && rawBody.body !== null) ? rawBody.body : (rawBody || {});

  const content = String(body.content || '');
  let contentType = String(body.content_type || body.contentType || 'PLAIN_TEXT').toUpperCase();
  if (contentType !== 'PLAIN_TEXT' && contentType !== 'HTML') contentType = 'PLAIN_TEXT';

  return {
    focus_entity: String(body.focus_entity || body.focusEntity || '').trim(),
    language: String(body.language || 'en').trim(),
    content_type: contentType,
    content,
    requested_at: body.requested_at || new Date().toISOString(),
  };
}

// ---------- HTML helpers ----------

function decodeEntities(s) {
  return s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function htmlToPlainText(html) {
  return decodeEntities(
    html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function extractTags(html, tag) {
  const re = new RegExp('<' + tag + '\\b[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 'gi');
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push(decodeEntities(m[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()));
  }
  return out;
}

// ---------- focus matching ----------

function makeFocusMatcher(focus) {
  const focusLower = focus.toLowerCase();
  const focusTokens = focusLower.split(/\s+/).filter((t) => t.length > 1);

  const containsFocus = (text) => {
    if (!text || !focusLower) return false;
    const lower = text.toLowerCase();
    if (lower.includes(focusLower)) return true;
    if (focusTokens.length >= 2 && focusTokens.every((t) => lower.includes(t))) return true;
    return false;
  };

  const entityMatchesFocus = (e) => {
    const n = (e.name || '').toLowerCase();
    if (!n || !focusLower) return false;
    if (n === focusLower) return true;
    if (n.includes(focusLower)) return true;
    const focusTokensArr = focusLower.split(/\s+/);
    if (n.length >= 3 && focusTokensArr.includes(n)) return true;
    if (focusTokens.length >= 2) {
      const nTokens = n.split(/\s+/);
      const overlap = focusTokens.filter((t) => nTokens.includes(t)).length;
      if (overlap / focusTokens.length >= 0.7) return true;
    }
    return false;
  };

  return { focusLower, focusTokens, containsFocus, entityMatchesFocus };
}

// ---------- n-grams ----------

function tokenizeForNgrams(t) {
  return t.toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w) && w.length > 1);
}

function buildNgrams(tokens, n, focusTokens) {
  const counts = new Map();
  for (let i = 0; i <= tokens.length - n; i++) {
    const phrase = tokens.slice(i, i + n).join(' ');
    counts.set(phrase, (counts.get(phrase) || 0) + 1);
  }
  return [...counts.entries()]
    .filter(([_, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([phrase, count]) => ({
      phrase,
      count,
      contains_focus: focusTokens.some((t) => phrase.split(' ').includes(t)),
    }))
    .slice(0, 20);
}

// ---------- compute features ----------

function computeFeatures(inputs, nlpResp) {
  if (nlpResp && nlpResp._error) {
    return { error: 'Google NLP error: ' + nlpResp._error, detail: nlpResp };
  }
  if (nlpResp && nlpResp.error) {
    return { error: 'Google NLP error: ' + (nlpResp.error.message || nlpResp.error.code || 'unknown'), detail: nlpResp.error };
  }

  const entities = Array.isArray(nlpResp && nlpResp.entities) ? nlpResp.entities : [];
  const focus = (inputs.focus_entity || '').trim();
  const { focusLower, focusTokens, containsFocus, entityMatchesFocus } = makeFocusMatcher(focus);

  const isHtml = inputs.content_type === 'HTML';
  const rawContent = inputs.content || '';
  const plainText = isHtml ? htmlToPlainText(rawContent) : rawContent;

  const h1List = isHtml ? extractTags(rawContent, 'h1') : [];
  const h2List = isHtml ? extractTags(rawContent, 'h2') : [];
  const h3List = isHtml ? extractTags(rawContent, 'h3') : [];

  const inH1 = h1List.some(containsFocus);
  const inH2Count = h2List.filter(containsFocus).length;
  const inH3Count = h3List.filter(containsFocus).length;

  const firstSentence = (plainText.split(/(?<=[.!?])\s+/)[0] || '').slice(0, 400);
  const inFirstSentence = containsFocus(firstSentence);

  const focusEntities = entities.filter(entityMatchesFocus);
  const focusSalience = focusEntities.reduce((s, e) => s + (Number(e.salience) || 0), 0);
  const focusMentions = focusEntities.reduce((s, e) => s + ((e.mentions || []).length), 0);
  const firstMentionOffsets = focusEntities.flatMap((e) =>
    (e.mentions || []).map((m) => (m.text && Number(m.text.beginOffset)) || Infinity)
  );
  const firstMentionOffset = firstMentionOffsets.length ? Math.min(...firstMentionOffsets) : null;

  const sortedEntities = [...entities].sort((a, b) => (Number(b.salience) || 0) - (Number(a.salience) || 0));
  const topEntity = sortedEntities[0] || null;
  const isTopEntity = !!(topEntity && entityMatchesFocus(topEntity));

  const enrichedEntities = sortedEntities.map((e) => ({
    name: e.name,
    type: e.type,
    salience: Number(e.salience) || 0,
    mentions: (e.mentions || []).length,
    wikipedia_url: (e.metadata && e.metadata.wikipedia_url) || null,
    is_focus: entityMatchesFocus(e),
  }));

  const ngramTokens = tokenizeForNgrams(plainText);
  const bigrams = buildNgrams(ngramTokens, 2, focusTokens);
  const trigrams = buildNgrams(ngramTokens, 3, focusTokens);

  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const charCount = (inputs.content || '').length;

  // Rule-based recommendations
  const recs = [];
  if (focusSalience >= 0.40) recs.push({ type: 'ok', text: 'Focus is dominant (' + focusSalience.toFixed(2) + ') -- Google reads this content as deeply about your topic.' });
  else if (focusSalience >= 0.25) recs.push({ type: 'ok', text: 'Focus salience is solid (' + focusSalience.toFixed(2) + '). A few tweaks could push it to dominant.' });
  else if (focusSalience >= 0.10) recs.push({ type: 'improve', text: 'Focus salience is moderate (' + focusSalience.toFixed(2) + '). Tighten the topic by trimming off-topic sections and adding more mentions.' });
  else recs.push({ type: 'critical', text: 'Focus salience is weak (' + focusSalience.toFixed(2) + '). The focus is buried as a tangential detail.' });

  if (!isTopEntity && topEntity) {
    recs.push({ type: 'critical', text: 'The #1 entity is "' + topEntity.name + '" (salience ' + (Number(topEntity.salience) || 0).toFixed(2) + '). Either pivot the page toward your focus, or rename the focus to what the content actually centres on.' });
  } else if (isTopEntity) {
    recs.push({ type: 'ok', text: 'Your focus is the #1 entity in the document.' });
  }

  if (isHtml) {
    if (!inH1) recs.push({ type: 'improve', text: 'Add your focus entity to the H1.' });
    else recs.push({ type: 'ok', text: 'Focus is in the H1.' });
    if (h2List.length > 0 && inH2Count === 0) recs.push({ type: 'improve', text: 'Mention the focus (or a close variant) in at least one H2 -- currently in 0 of ' + h2List.length + '.' });
    else if (inH2Count > 0) recs.push({ type: 'ok', text: 'Focus appears in ' + inH2Count + ' of ' + h2List.length + ' H2 headings.' });
  } else {
    recs.push({ type: 'improve', text: 'Pasted as plain text -- to get heading-level position signals, paste the HTML source instead and toggle the editor to HTML mode.' });
  }

  if (!inFirstSentence) recs.push({ type: 'improve', text: 'Move the focus into the first sentence of the article -- Google weights early-position tokens higher.' });
  else recs.push({ type: 'ok', text: 'Focus is in the first sentence.' });

  if (focusMentions === 0) recs.push({ type: 'critical', text: 'Google did not detect your focus as an entity at all. Check spelling, or use the canonical phrasing of the topic.' });
  else if (focusMentions < 3) recs.push({ type: 'improve', text: 'Only ' + focusMentions + ' mention(s) of the focus entity detected. Aim for 5-10 natural mentions throughout the body.' });

  const strengthLabel = focusSalience >= 0.40 ? 'Dominant' : focusSalience >= 0.25 ? 'Strong' : focusSalience >= 0.10 ? 'Moderate' : 'Weak';

  return {
    focus_entity: focus,
    focus_salience: focusSalience,
    focus_strength_label: strengthLabel,
    is_top_entity: isTopEntity,
    actual_top_entity: isTopEntity ? null : (topEntity ? { name: topEntity.name, salience: Number(topEntity.salience) || 0, type: topEntity.type } : null),
    position_signals: {
      in_h1: inH1,
      in_h2_count: inH2Count,
      in_h3_count: inH3Count,
      in_first_sentence: inFirstSentence,
      first_mention_offset: firstMentionOffset === Infinity ? null : firstMentionOffset,
      total_mentions: focusMentions,
    },
    stats: {
      word_count: wordCount,
      char_count: charCount,
      headings: { h1: h1List.length, h2: h2List.length, h3: h3List.length },
    },
    entities: enrichedEntities.slice(0, 25),
    ngrams: { bigrams, trigrams },
    recommendations: recs,
    request: { focus_entity: focus, language: inputs.language, content_type: inputs.content_type },
    generated_at: new Date().toISOString(),
  };
}

// ---------- AI strategy layer ----------

const AI_SYSTEM_PROMPT = [
  "You are a senior on-page SEO strategist analyzing a Google Cloud NLP salience audit. The user wants concrete, actionable guidance to lift the salience score of their focus entity -- so Google's NLP reads the page as being about the RIGHT topic.",
  '',
  'GROUNDING RULES (non-negotiable):',
  '1. Base EVERY suggestion on the data in <signals>. Do not invent entities, n-grams, sub-topics, or facts that are not present.',
  '2. When you reference an entity or n-gram, use its EXACT wording from the data.',
  '3. Distinguish keywords/phrases (specific wording to add/cut) from topics (subjects to expand or trim).',
  '4. Every structural move must cite a position signal (no H1 hit, missing from first sentence, only N H2 mentions, focus not the top entity, etc.).',
  '5. Be honest about predicted lift. If the focus is buried (salience < 0.10) and the top entity is unrelated, recommend a CONTENT PIVOT, not cosmetic changes.',
  '6. Keep suggestions SEO-actionable. No fluff, no hedging ("consider", "might"). Use imperatives.',
  '',
  'OUTPUT: JSON only. No prose, no markdown fences. Schema EXACTLY:',
  '{',
  '  "summary": "1-2 sentence diagnosis of the salience situation",',
  '  "keyword_strategy": {',
  '    "double_down": [ { "phrase": "exact wording from data", "where": "H1|intro|sections|FAQ", "why": "1 sentence" } ],',
  '    "add": [ { "phrase": "new phrase not yet in data", "why": "1 sentence" } ],',
  '    "reduce": [ { "phrase": "competing entity from data", "why": "1 sentence -- why it dilutes focus" } ]',
  '  },',
  '  "topic_strategy": {',
  '    "expand": [ { "topic": "topic name", "why": "1 sentence" } ],',
  '    "trim": [ { "topic": "topic name", "why": "1 sentence" } ]',
  '  },',
  '  "structural_moves": [',
  '    { "action": "imperative instruction", "impact": "high|medium|low", "rationale": "ties to a specific position signal" }',
  '  ],',
  '  "predicted_lift": "1 sentence with numeric estimate range (e.g. Expect salience to lift from 0.05 to 0.35-0.45 after these changes.)"',
  '}',
  '',
  'Each array can have 0-5 items. Omit array items when nothing meaningful applies. Keep arrays short and high-signal.',
].join('\n');

function buildAiUserPrompt(features, plainExcerpt, plainLen) {
  const entities = (features.entities || []).slice(0, 15);
  const bigrams = (features.ngrams && features.ngrams.bigrams) || [];
  const trigrams = (features.ngrams && features.ngrams.trigrams) || [];
  const recs = features.recommendations || [];
  const actualTop = features.actual_top_entity;

  return [
    'FOCUS ENTITY: ' + features.focus_entity,
    'CURRENT FOCUS SALIENCE: ' + features.focus_salience.toFixed(3) + ' (' + features.focus_strength_label + ')',
    'IS FOCUS THE TOP ENTITY: ' + features.is_top_entity,
    actualTop ? ('ACTUAL TOP ENTITY: ' + actualTop.name + ' (salience ' + Number(actualTop.salience).toFixed(3) + ', type ' + actualTop.type + ')') : '',
    '',
    '<signals>',
    'POSITION SIGNALS:',
    JSON.stringify(features.position_signals, null, 2),
    '',
    'STATS:',
    JSON.stringify(features.stats, null, 2),
    '',
    'TOP ENTITIES (from Google NLP, sorted by salience):',
    JSON.stringify(entities, null, 2),
    '',
    'TOP BIGRAMS: ' + bigrams.slice(0, 12).map((b) => b.phrase + ' (' + b.count + ')').join(', '),
    'TOP TRIGRAMS: ' + trigrams.slice(0, 8).map((t) => t.phrase + ' (' + t.count + ')').join(', '),
    '',
    'RULE-BASED RECOMMENDATIONS (already shown to user):',
    recs.map((r) => '- [' + (r.type || '') + '] ' + r.text).join('\n'),
    '</signals>',
    '',
    'CONTENT EXCERPT (first 800 chars of plain text from the page):',
    '"' + plainExcerpt + '"' + (plainLen > 800 ? ' ...[truncated]' : ''),
    '',
    'Return your AI Strategy as JSON.',
  ].filter(Boolean).join('\n');
}

async function addAiSuggestions(features, inputs) {
  // Plain-text excerpt to ground the model in the actual content.
  const plainText = inputs.content_type === 'HTML'
    ? htmlToPlainText(inputs.content || '')
    : (inputs.content || '').replace(/\s+/g, ' ').trim();
  const excerpt = plainText.slice(0, 800);

  const userPrompt = buildAiUserPrompt(features, excerpt, plainText.length);

  try {
    const resp = await chat({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: AI_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.25,
      responseFormat: 'json_object',
      timeoutMs: 45000,
      title: 'On-Page SEO :: Salience Score AI Strategy',
    });

    const parsed = parseChatJson(resp);
    if (parsed.error) {
      features.ai_suggestions = null;
      features.ai_suggestions_error = parsed.error;
      if (parsed.raw_text) features.ai_suggestions_raw = parsed.raw_text;
      return features;
    }

    features.ai_suggestions = parsed.json;
    features.ai_model = AI_MODEL;
    return features;
  } catch (err) {
    features.ai_suggestions = null;
    features.ai_suggestions_error = String(err && err.message ? err.message : err);
    return features;
  }
}

// ---------- handler ----------

async function handle(req, res) {
  const rawBody = req.body || {};

  if (rawBody.test === true || (rawBody.body && rawBody.body.test === true)) {
    return res.json({
      ok: true,
      message: 'Salience webhook reachable',
      received_at: new Date().toISOString(),
    });
  }

  const inputs = normalizeInput(rawBody);

  if (!inputs.content.trim()) {
    return res.status(400).json({ error: 'content is required' });
  }

  // Stage 1: Google NLP.
  const nlpResp = await analyzeEntities({
    content: inputs.content,
    type: inputs.content_type,
    language: inputs.language,
    timeoutMs: 30000,
  });

  // Stage 2: deterministic feature computation.
  const features = computeFeatures(inputs, nlpResp);
  if (features.error) {
    return res.json(features);
  }

  // Stage 3: AI strategy (graceful failure).
  await addAiSuggestions(features, inputs);

  return res.json(features);
}

module.exports = { handle };

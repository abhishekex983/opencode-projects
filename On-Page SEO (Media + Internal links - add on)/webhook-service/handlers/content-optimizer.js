// Content Optimizer handlers — port of the n8n "Content Optimizer -- Outline + Content"
// workflow. Two endpoints in one module:
//   - handleOutline:  POST /webhook/content-optimizer-outline
//   - handleContent:  POST /webhook/content-optimizer-content
//
// Both keep the same request/response shape as the live n8n webhooks so the
// dashboard only needs URL swaps.

const { chat, parseChatJson } = require('../util/openrouter');

const TRANSCRIBE_MODEL = 'google/gemini-2.5-flash';
const OUTLINE_MODEL = 'anthropic/claude-sonnet-4.5';
const CONTENT_MODEL = 'anthropic/claude-sonnet-4.5';

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

function normalizeOutlineInput(rawBody) {
  const form = unwrapBody(rawBody);
  const p = (...k) => pickFromForm(form, ...k);
  return {
    input_type: p('input_type', 'inputType') || 'text',
    text: p('text', 'client_text', 'clientText') || '',
    audio_base64: p('audio_base64', 'audioBase64') || '',
    audio_format: p('audio_format', 'audioFormat') || 'webm',
    focus_keyword: p('focus_keyword', 'Focus Keyword', 'focusKeyword') || '',
    header_keywords: toArr(p('header_keywords', 'Header Keywords', 'headerKeywords')),
    entities: toArr(p('entities', 'Entities')),
    common_keywords: toArr(p('common_keywords', 'Common Keywords', 'commonKeywords')),
    extra_keywords: toArr(p('extra_keywords', 'Extra Keywords', 'extraKeywords')),
    intent_context_text: String(p('intent_context_text', 'intentContextText') || '').trim(),
    salience_context_text: String(p('salience_context_text', 'salienceContextText') || '').trim(),
    audience_context_text: String(p('audience_context_text', 'audienceContextText') || '').trim(),
    internal_links: Array.isArray(form.internal_links) ? form.internal_links.filter(u => typeof u === 'string' && /^https?:\/\//.test(u)) : [],
  };
}

function normalizeContentInput(rawBody) {
  const form = unwrapBody(rawBody);
  const p = (...k) => pickFromForm(form, ...k);
  return {
    model: p('model', 'Model') || '',
    edited_outline: p('edited_outline', 'outline', 'editedOutline') || '',
    focus_keyword: p('focus_keyword', 'Focus Keyword', 'focusKeyword') || '',
    header_keywords: toArr(p('header_keywords', 'Header Keywords', 'headerKeywords')),
    entities: toArr(p('entities', 'Entities')),
    common_keywords: toArr(p('common_keywords', 'Common Keywords', 'commonKeywords')),
    extra_keywords: toArr(p('extra_keywords', 'Extra Keywords', 'extraKeywords')),
    intent_context_text: String(p('intent_context_text', 'intentContextText') || '').trim(),
    salience_context_text: String(p('salience_context_text', 'salienceContextText') || '').trim(),
    audience_context_text: String(p('audience_context_text', 'audienceContextText') || '').trim(),
    internal_links: Array.isArray(form.internal_links) ? form.internal_links.filter(u => typeof u === 'string' && /^https?:\/\//.test(u)) : [],
  };
}

// ---------- audio transcription ----------

async function transcribeAudio({ audioBase64, audioFormat }) {
  const resp = await chat({
    model: TRANSCRIBE_MODEL,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'Transcribe the audio verbatim. Output only the transcribed text. Do not summarize, paraphrase, or add any preamble or formatting.' },
        { type: 'input_audio', input_audio: { data: audioBase64, format: audioFormat || 'webm' } },
      ],
    }],
    responseFormat: null,
    temperature: 0,
    timeoutMs: 120000,
    title: 'Content Optimizer :: Transcribe',
  });

  if (resp && resp._error) {
    return { error: 'Transcription failed', detail: resp._error };
  }
  if (resp && resp.error) {
    return { error: 'Transcription failed', detail: resp.error };
  }
  const transcript = resp && resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content;
  if (!transcript) {
    return { error: 'Empty transcript from OpenRouter', raw: resp };
  }
  return { transcript, source: 'audio', transcription_model: TRANSCRIBE_MODEL };
}

// ---------- outline prompt ----------

const OUTLINE_FORMAT = `H1: {focus keyword}: {USP}

[Intro paragraph -- above-the-fold summary]
Describe what the writer should put here (no heading). Aim: a 2-3 sentence above-the-fold summary that names the {focus keyword} in the first sentence, states who the page serves and what they'll get, mentions 1-2 must-cover entities or value propositions to anchor topical relevance, and reads benefit-led (not promotional).

H2: Why Us [Include Header keywords and Entities]
Create content based on Entities, common keywords, and extra keywords.

H3: [Value proposition 1 with Header keywords]
Create content based on the Entities, common keywords, and extra keywords.

H3: [Value proposition 2 with Header keywords]
Create content based on the Entities, common keywords, and extra keywords.

H3: [Value proposition 3 with Header keywords]
Create content based on the Entities, common keywords, and extra keywords.

H2: Our Services [Include Relevant Header keywords and Entities]
Create content based on the Entities, common keywords, and extra keywords.

H3: [Service 1 with Header keywords]
Create content based on the Entities, common keywords, and extra keywords.

H3: [Service 2 with Header keywords]
Create content based on the Entities, common keywords, and extra keywords.

H3: [Service 3 with Header keywords]
Create content based on the Entities, common keywords, and extra keywords.

H2: What our clients say about us [Include Header keywords and Entities]
Create content based on Entities, common keywords, and extra keywords.

H2: Contact Us [Include Relevant Header keywords and Entities]
Create content based on the Entities, common keywords, and extra keywords.

H2: FAQ [Include Relevant Header keywords and Entities]

H3: FAQ [Include Relevant Header keywords and Entities]
Create content based on the Entities, common keywords, and extra keywords.

H3: FAQ [Include Relevant Header keywords and Entities]
Create content based on the Entities, common keywords, and extra keywords.

H3: FAQ [Include Relevant Header keywords and Entities]
Create content based on the Entities, common keywords, and extra keywords.

H3: FAQ [Include Relevant Header keywords and Entities]
Create content based on the Entities, common keywords, and extra keywords.

H3: FAQ [Include Relevant Header keywords and Entities]
Create content based on the Entities, common keywords, and extra keywords.

H3: FAQ [Include Relevant Header keywords and Entities]
Create content based on the Entities, common keywords, and extra keywords.`;

const OUTLINE_SYSTEM_PROMPT = `You are a senior on-page SEO strategist. You write service-page outlines that rank in Google AND are quoted by LLM-based search (ChatGPT, Gemini, Perplexity).

GROUNDING RULES:
1. Use the transcript to infer the USP, Why Us reasons, three value propositions, and three services. If any of those cannot be inferred, write [TO FILL: <label>] so the marketer knows to complete it.
2. Weave the marketer's Focus Keyword, Header Keywords, Entities, and Common Keywords naturally into H1/H2/H3 headings per the outline format. Do not keyword-stuff.
3. Every section body must be one or two short lines describing what the section should cover, citing which entities/keywords to include. Do NOT write the actual paragraph content here -- outlines only.
3a. The [Intro paragraph -- above-the-fold summary] section sits between the H1 and the first H2 and has NO heading. Its description must guide the writer toward a 2-3 sentence intro that (a) opens with the focus keyword in the first sentence, (b) names 1-2 must-cover entities so Google's NLP picks up topical salience above the fold, (c) reads benefit-led. Keep the literal label '[Intro paragraph -- above-the-fold summary]' in the outline so the writer recognises it.
4. Preserve the exact section order and heading levels in the format template.
5. SEARCH INTENT INSIGHTS: If <intent_context> contains content, treat it as authoritative truth about what users searching the focus keyword actually want. Tailor every section body to the stated primary intent. Use any listed sub-intents to inspire FAQ questions (at least 3 FAQ entries should mirror sub-intent labels, rephrased as questions). Honor any recommended page archetype. If a modifier-SERP conflict is flagged, follow the guidance even when it contradicts what the focus keyword superficially implies. If the block is empty, proceed normally.
6. SALIENCE INSIGHTS: If <salience_context> contains content (must-cover entities, H2 candidates, supporting topics, target word count), integrate the must-cover entities naturally throughout the outline body descriptions, use H2 candidate phrasings where they fit the format template, and aim the implied content depth at the target word count. The format template's section order is canonical -- adapt the content to fit the template, not the other way around. If the block is empty, proceed normally.
7. AUDIENCE RESEARCH: If <audience_context> contains content (problem clusters with representative questions and content angles, plus People Also Ask entries), use the listed *user problems* as the primary source for FAQ questions -- replace the generic FAQ placeholders with the highest-weighted clusters' representative questions, rephrased as natural user-style queries. Where a cluster lists a "content_angle", let it shape the body description of the most relevant section (intro, value props, or service section). If a cluster carries an emotional or trust concern (pain, cost, safety, side effects), surface it in either the intro or the closest H2 body so it's not buried in the FAQ. If <audience_context> is empty, proceed normally.
8. INTERNAL LINKING: If <internal_links> is provided, identify 3-5 sections where internal links would be contextually relevant. In those section descriptions, add a note like "[Internal link: use URL here -- anchor text suggestion]". Only link to pages whose topic genuinely matches the section content based on the URL path. Never force irrelevant links.

TONE: Clear, benefit-led, scannable. No fluff.

OUTPUT: Plain markdown. No preamble. No trailing commentary. No code fences.`;

const QUESTIONNAIRE_NOTE = `The client transcript below answered these questions (from Questionnaire.txt):
- What is your USP? (answer begins with "We sell..."; whatever follows is the value proposition)
- Why us? (why prospects should buy, how it differs from competitors)
- Three value propositions (e.g. "$400M annual comp supported", "360 degree SPM service", "50+ combined experience years")
- What services we offer (service 1, service 2, service 3)`;

function buildOutlineUserPrompt({ form, transcript, source }) {
  return `${QUESTIONNAIRE_NOTE}

<transcript source="${source || 'text'}">
${transcript || '(empty -- client did not provide text or audio)'}
</transcript>

<marketer_inputs>
Focus Keyword: ${form.focus_keyword || '(not set)'}
Header Keywords: ${(form.header_keywords || []).join(', ') || '(not set)'}
Entities: ${(form.entities || []).join(', ') || '(not set)'}
Common Keywords: ${(form.common_keywords || []).join(', ') || '(not set)'}
Extra Keywords: ${(form.extra_keywords || []).join(', ') || '(not set)'}
</marketer_inputs>

<intent_context>
${form.intent_context_text || '(not provided -- proceed using the focus keyword and transcript alone)'}
</intent_context>

<salience_context>
${form.salience_context_text || '(not provided -- proceed without entity-coverage guidance)'}
</salience_context>

<audience_context>
${form.audience_context_text || '(not provided -- proceed without audience-research guidance; FAQs should follow the focus keyword and intent context alone)'}
</audience_context>
${form.internal_links && form.internal_links.length > 0 ? `
<internal_links>
Available internal URLs for contextual linking. Only use when the surrounding content genuinely matches the URL topic. Use the URL path to judge relevance.
${form.internal_links.map(u => '- ' + u).join('\\n')}
</internal_links>` : ''}

<outline_format>
${OUTLINE_FORMAT}
</outline_format>

Produce the filled-in outline now. Replace every placeholder ({focus keyword}, {USP}, [Value proposition N with Header keywords], [Service N with Header keywords], [Include Header keywords and Entities], [Include Relevant Header keywords and Entities]) with specific content derived from the transcript + marketer inputs. Keep the "Create content based on..." description lines and tailor them to the entities/keywords most relevant to that section.`;
}

// ---------- content prompt ----------

const CONTENT_SYSTEM_PROMPT = `You are a senior on-page SEO copywriter. You write service-page content that ranks in Google AND is quoted by LLM-based search.

GROUNDING RULES:
1. Expand every section of the provided outline into final web copy. Do NOT add, remove, or reorder sections.
2. Under every heading, write concise, benefit-led prose (2-4 short paragraphs for H2s, 1-2 short paragraphs for H3s, unless the outline body says otherwise).
2a. If the outline contains a [Intro paragraph -- above-the-fold summary] section between the H1 and the first H2, expand it into a SINGLE 2-3 sentence paragraph BEFORE the first H2 with NO heading. The focus keyword must appear in the first sentence verbatim. Name 1-2 must-cover entities here for above-the-fold salience. Strip the literal '[Intro paragraph -- above-the-fold summary]' label from your output -- only the prose remains in the final markdown.
3. Naturally weave in the Focus Keyword, Header Keywords, Entities, and Common Keywords. Use the Focus Keyword in the H1 and once in the opening paragraph. Use Entities where they add trust signals. Do not keyword-stuff; aim for reader-first copy that still satisfies entity coverage.
4. Under the FAQ section, write the actual question as the H3 and a 2-4 sentence answer underneath. Replace every "FAQ [Include Relevant Header keywords and Entities]" H3 with a real question a prospect would ask.
5. For any [TO FILL] markers in the outline, leave a [TO FILL: <label>] placeholder instead of fabricating -- the marketer will fill those in.
6. SEARCH INTENT INSIGHTS: If <intent_context> contains content, calibrate tone, depth, and CTAs to the stated primary intent. Transactional -> direct buy/book CTAs and proof-driven copy. Commercial Investigation -> comparison language, decision criteria, trust signals (reviews, awards, case studies). Informational -> explainer-first prose, lower CTA prominence, longer explanations. Local -> location signals (city, neighborhoods) and proximity language. FAQ answers must directly address the listed sub-intents in order. If a modifier-SERP conflict is flagged, follow that guidance. If the block is empty, default to a balanced commercial tone.
7. SALIENCE INSIGHTS: If <salience_context> contains content, weave the must-cover entities naturally throughout the body copy (use the exact entity names; don't paraphrase them away). Match the implied content depth and word count. Use entity wording in headings where the outline permits.
8. AUDIENCE RESEARCH: If <audience_context> contains content (problem clusters with representative questions, content angles, and quotes from real users in PAA / Reddit / Quora / forums / YouTube), use it to (a) write FAQ answers in the user's own register -- mirror the phrasing pattern of the representative questions, (b) address the top emotional/practical concerns (pain, cost, safety, side effects, etc.) explicitly in the intro or earliest relevant H2 rather than burying them, (c) name the specific objections users raised when writing trust-building copy. Do NOT quote forum users verbatim in the page copy; treat the quotes as evidence of phrasing and concern, not as content to copy-paste. If the block is empty, proceed normally.
9. INTERNAL LINKING: If <internal_links> is provided, identify 3-5 places in the content where internal links are contextually relevant. Insert them as markdown links: [descriptive anchor text](URL). Anchor text must be natural, descriptive, and match the linked page topic. Only use a link when the surrounding content genuinely relates to that URL. Never force irrelevant links. Skip a link if no section is a good fit.

FORMAT: Pure markdown. Preserve the H1/H2/H3 structure exactly. No preamble, no trailing commentary, no code fences.

TONE: Direct, prescriptive, confidence-building. Short sentences. No filler phrases ("in today's world", "in conclusion", etc.).`;

function buildContentUserPrompt(form) {
  return `<marketer_inputs>
Focus Keyword: ${form.focus_keyword || '(not set)'}
Header Keywords: ${(form.header_keywords || []).join(', ') || '(not set)'}
Entities: ${(form.entities || []).join(', ') || '(not set)'}
Common Keywords: ${(form.common_keywords || []).join(', ') || '(not set)'}
Extra Keywords: ${(form.extra_keywords || []).join(', ') || '(not set)'}
</marketer_inputs>

<intent_context>
${form.intent_context_text || '(not provided -- expand the outline as written without intent calibration)'}
</intent_context>

<salience_context>
${form.salience_context_text || '(not provided -- expand without entity-coverage guidance)'}
</salience_context>

<audience_context>
${form.audience_context_text || '(not provided -- write FAQs and trust copy without specific audience-pain calibration)'}
</audience_context>

<edited_outline>
${form.edited_outline}
</edited_outline>
${form.internal_links && form.internal_links.length > 0 ? `
<internal_links>
Available internal URLs for contextual linking. Only place a link when the surrounding content genuinely matches the URL topic. Use the URL path to judge relevance. Insert links naturally using markdown format: [anchor text](URL). Anchor text must be descriptive and match the linked page topic.
${form.internal_links.map(u => '- ' + u).join('\\n')}
</internal_links>` : ''}

Now expand the outline into final service-page content.`;
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

  // Stage 1: transcribe if audio supplied, otherwise pass text through.
  const hasAudio = !!(form.audio_base64 && form.audio_base64.length > 100);
  let transcript = form.text || '';
  let source = 'text';

  if (hasAudio) {
    const t = await transcribeAudio({ audioBase64: form.audio_base64, audioFormat: form.audio_format });
    if (t.error) {
      return res.json({ error: t.error, detail: t.detail });
    }
    transcript = t.transcript;
    source = 'audio';
  }

  // Stage 2: outline LLM call.
  const resp = await chat({
    model: OUTLINE_MODEL,
    messages: [
      { role: 'system', content: OUTLINE_SYSTEM_PROMPT },
      { role: 'user', content: buildOutlineUserPrompt({ form, transcript, source }) },
    ],
    temperature: 0.3,
    responseFormat: null,
    timeoutMs: 120000,
    title: 'Content Optimizer :: Outline',
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

  return res.json({
    request: {
      focus_keyword: form.focus_keyword,
      header_keywords: form.header_keywords,
      entities: form.entities,
      common_keywords: form.common_keywords,
      extra_keywords: form.extra_keywords,
      source,
    },
    transcript,
    outline: stripFences(outline),
    model: OUTLINE_MODEL,
    usage: resp.usage || null,
    generated_at: new Date().toISOString(),
  });
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
    model: form.model || CONTENT_MODEL,
    messages: [
      { role: 'system', content: CONTENT_SYSTEM_PROMPT },
      { role: 'user', content: buildContentUserPrompt(form) },
    ],
    temperature: 0.35,
    responseFormat: null,
    timeoutMs: 120000,
    title: 'Content Optimizer :: Content',
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
    model: form.model || CONTENT_MODEL,
    stats: { word_count: wordCount, h1: h1Count, h2: h2Count, h3: h3Count },
    usage: resp.usage || null,
    generated_at: new Date().toISOString(),
  });
}

module.exports = { handleOutline, handleContent };

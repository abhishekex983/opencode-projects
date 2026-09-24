// Blog Post Creation handlers — outline generation + content expansion for blog
// posts. Two endpoints in one module:
//   - handleOutline: POST /webhook/blog-post-outline
//   - handleContent: POST /webhook/blog-post-content
//
// Same request/response shape pattern as content-optimizer.js so the dashboard
// only needs URL swaps.

const { chat, parseChatJson } = require('../util/openrouter');
const exa = require('../util/exa');

const OUTLINE_MODEL = 'google/gemini-2.5-pro';
const CONTENT_MODEL = 'google/gemini-2.5-pro';
const TLDR_MODEL = 'google/gemini-2.5-pro';
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
    writing_style: p('writing_style', 'Writing Style', 'writingStyle') || '',
    writing_styles_webhook: p('writing_styles_webhook', 'Writing Styles Webhook', 'writingStylesWebhook') || '',
    voice: p('voice', 'Voice') || '',
    anecdotes: p('anecdotes', 'Anecdotes') || '',
    opinions: p('opinions', 'Opinions') || '',
    stats_enabled: parseBool(p('stats_enabled', 'Stats Enabled', 'statsEnabled')),
    focus_keyword: p('focus_keyword', 'Focus Keyword', 'focusKeyword') || '',
    header_keywords: toArr(p('header_keywords', 'Header Keywords', 'headerKeywords')),
    entities: toArr(p('entities', 'Entities')),
    common_keywords: toArr(p('common_keywords', 'Common Keywords', 'commonKeywords')),
    extra_keywords: toArr(p('extra_keywords', 'Extra Keywords', 'extraKeywords')),
    target_word_count: parseInt(p('target_word_count', 'Target Word Count', 'targetWordCount'), 10) || 0,
    intent_context_text: String(p('intent_context_text', 'intentContextText') || '').trim(),
    serp_context_text: String(p('serp_context_text', 'serpContextText') || '').trim(),
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
    writing_style: p('writing_style', 'Writing Style', 'writingStyle') || '',
    writing_styles_webhook: p('writing_styles_webhook', 'Writing Styles Webhook', 'writingStylesWebhook') || '',
    focus_keyword: p('focus_keyword', 'Focus Keyword', 'focusKeyword') || '',
    header_keywords: toArr(p('header_keywords', 'Header Keywords', 'headerKeywords')),
    entities: toArr(p('entities', 'Entities')),
    common_keywords: toArr(p('common_keywords', 'Common Keywords', 'commonKeywords')),
    extra_keywords: toArr(p('extra_keywords', 'Extra Keywords', 'extraKeywords')),
    target_word_count: parseInt(p('target_word_count', 'Target Word Count', 'targetWordCount'), 10) || 0,
    intent_context_text: String(p('intent_context_text', 'intentContextText') || '').trim(),
    serp_context_text: String(p('serp_context_text', 'serpContextText') || '').trim(),
    salience_context_text: String(p('salience_context_text', 'salienceContextText') || '').trim(),
    audience_context_text: String(p('audience_context_text', 'audienceContextText') || '').trim(),
    internal_links: Array.isArray(form.internal_links) ? form.internal_links.filter(u => typeof u === 'string' && /^https?:\/\//.test(u)) : [],
  };
}

// ---------- stats scraping pipeline ----------

function getDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

async function fetchStats(topic, focusKeyword) {
  const query = (topic || focusKeyword).trim();
  if (!query) return { stats_block: '', sources: [], source_count: 0, error: 'No topic or focus keyword to search for stats.' };

  try {
    const searchOpts = {
      query: query + ' statistics data study research',
      numResults: 8,
      timeoutMs: 30000,
      source: 'stats',
    };

    const result = await exa.searchAndContents(searchOpts);
    if (!result || result.error || !Array.isArray(result.results) || result.results.length === 0) {
      return { stats_block: '', sources: [], source_count: 0, error: result.error || 'No statistical sources found for this topic.' };
    }

    const sources = [];
    const texts = [];
    let sourceCount = 0;
    for (const r of result.results) {
      const body = (r.text || '').trim();
      if (body.length > 100) {
        const sourceTitle = r.title || r.url || 'unknown';
        const sourceUrl = r.url || '';
        const domain = getDomain(sourceUrl);
        const excerpt = body.slice(0, 200).trim();

        sources.push({ title: sourceTitle, url: sourceUrl, domain, excerpt });
        texts.push('[Source: ' + sourceTitle + ']\n' + body);
        sourceCount++;
      }
      if (sourceCount >= 5) break;
    }

    if (texts.length === 0) {
      return { stats_block: '', sources: [], source_count: 0, error: 'Exa results had insufficient text content.' };
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

    return { stats_block: statsBlock, sources, source_count: sourceCount, error: null };
  } catch (err) {
    return { stats_block: '', sources: [], source_count: 0, error: 'Stats scraping failed: ' + (err.message || String(err)) };
  }
}

// ---------- prompts ----------

const OUTLINE_SYSTEM_PROMPT = 'You are a senior blog editor and SEO strategist. You write blog-post outlines that rank in Google AND are quoted by LLM-based search (ChatGPT, Gemini, Perplexity).\n\nGROUNDING RULES:\n1. SEARCH INTENT INSIGHTS (HIGHEST PRIORITY): If <intent_context> contains content, treat it as authoritative truth about what users searching this topic actually want. Shape the outline to address the stated primary intent. Use sub-intents to inspire section topics. If a recommended page archetype is specified (listicle, guide, how-to, comparison, etc.), you MUST follow it exactly. Do NOT default to a generic guide structure if the intent calls for a listicle. If a modifier-SERP conflict is flagged, follow that guidance.\n2. SERP ANALYSIS (HIGHEST PRIORITY): If <serp_context> contains content, use it as authoritative competitive intelligence. Follow the SERP archetype specified. Match common patterns across top rankers. Incorporate standout signals as differentiators. Implement recommendations as structural requirements. This carries the same weight as Search Intent Insights.\n3. SALIENCE INSIGHTS (SECOND HIGHEST PRIORITY): If <salience_context> contains content (must-cover entities, H2 candidates, supporting topics), weave must-cover entities using exact entity names. Use H2/H3 candidates from salience as structural anchors. Give must-cover entities their own H2/H3 if they are significant enough.\n4. Design the blog structure yourself. Choose the best H1 title, section headings, and flow based on the topic, voice, anecdotes, opinions, stats, and keyword context provided. Do NOT follow a fixed template — let the content dictate the structure.\n5. The H1 must include the Focus Keyword naturally. It should read like a compelling blog title, not a keyword-stuffed headline.\n6. Every section body must be one or two short lines describing what the writer should cover in that section, citing which keywords / entities / anecdotes / stats to weave in. Do NOT write the actual paragraph content here — outlines only.\n7. Weave keywords naturally: Focus Keyword in the H1 and intro, Header Keywords in H2/H3 headings, Entities where they add authority, Common/Extra Keywords throughout body descriptions.\n8. If <voice_context> is provided, write all section descriptions in that exact voice — mirror the tone, style, perspective, and audience level described. The outline itself should read as if written by that voice.\n9. If <anecdotes> are provided, place each anecdote in the most relevant section — tag it as [Include anecdote: <summary>] in the section body.\n10. If <opinions> are provided, ensure at least 1-2 sections explicitly call out the unique/contrarian takes. Tag them as [POV: <summary>].\n11. If <stats_context> is provided (statistics and data points from live research), weave the most relevant stats into appropriate sections. Tag them as [Include stat: <summary> — Source: <source name>](<source url>). Use the EXACT source name and URL from the stats_context. Do not fabricate new stats from thin air. The source name should be the readable anchor text (e.g., "HealthLine", not the full URL).\n12. AUDIENCE RESEARCH: If <audience_context> contains content (problem clusters with questions and content angles), use the user problems as primary inspiration for section topics. Address the top emotional/practical concerns early, not buried deep. Use representative questions as FAQ section prompts if the outline format warrants an FAQ.\n\nTONE: Match the provided voice exactly. If no voice is provided, default to conversational, authoritative, and benefit-driven.\n\nOUTPUT: Plain markdown. No preamble. No trailing commentary. No code fences.';

const OUTLINE_SYSTEM_PROMPT_WORDCOUNT_ADDON = '\n\n11. If a Target Word Count is provided in <marketer_inputs>, design the outline with enough sections and subsection depth to support approximately that word count. Aim for H2s with 2-4 paragraphs (200-400 words each) and H3s with 1-2 paragraphs (100-200 words each). If no word count is given, let the topic and intent dictate the outline depth.\n12. INTERNAL LINKING: If <internal_links> contains URLs, identify 3-5 sections where internal links would be contextually relevant. In those section descriptions, add a note like "[Internal link: use URL here — anchor text suggestion]". Only link to pages whose topic genuinely matches the section content based on the URL path. Never force irrelevant links.';

// ---------- writing style definitions (fallback) ----------

const WRITING_STYLES_FALLBACK = {
  'writing-with-confidence': `WRITING WITH CONFIDENCE — Style Guide:

SECTION 1: Getting Started
- Overcome writer's block by writing with purpose and showing up consistently.
- "Don't get it right, get it written" — perfectionism kills momentum.
- Build the habit of regular writing.

SECTION 2: Knowing Your Reader
- Practice empathy: see the world from your reader's perspective.
- Use terms your reader would understand, not industry jargon.
- Apply the "So what?" test — ask what's in it for the reader.
- Understand how readers actually read: they satisfice (scan for "good enough") in an F-pattern.
- Use the cocktail party effect: talk about the reader with "You" more than "We".
- Map your reader's current perception of you vs. what you want them to think.

SECTION 3: Write Less, Say More
- Replace lazy adjectives and adverbs with strong verbs (doing verbs).
- Use Hemingway App (hemingwayapp.com) to check readability.
- Eliminate filler words: driving, delivering, facilitating → use direct verbs.

SECTION 4: Get Your Message Across Widely
- Eliminate jargon — use simple, plain language.
- Watch out for the "curse of knowledge" — expertise can make you write for peers, not readers.
- Use splasho.com/upgoer5/ to test if your language is too complex.

SECTION 5: Craft Sentences That Sing
- Keep sentences under 24 words (aim for Gunning Fog Index score 9 = 14-year-old comprehension).
- Read sentences aloud to check flow.
- Bring the main point to the beginning of paragraphs (don't bury the lede).
- Focus on the "doer" (active voice): "Scientists discovered..." not "It was discovered..."
- Knit sentences: flow from known info → unknown info.

SECTION 6: Incorporate Stories
- Show, don't tell — paint pictures, don't describe acts.
- Source stories from: clients, salespeople, social media comments, conversations.
- Be concrete, not abstract: you can paint a picture of a PIZZA but not "Integrity".
- Use "Writer's Diet" — more verbs, fewer abstract nouns.
- Avoid filler words entirely.
- Create a swipefile of metaphors from everyday life (food, body, home, nature, work).
- Use metaphor templates: "It's a bit like...", "It's similar to...", "It reminds me of..."
- Structure stories: lead with the lede (most important point first), then build supporting details.
- Avoid passive verbs — test by excluding the "doer" and see if the sentence still makes sense.
- Relate data to stories readers can understand — give them the "Aha!" moment.`,
  'abhi': `PRIORITY ONE: Readability Rules

- Use 5th grade level language. Keep words simple. Short sentences. No jargon.
- Each paragraph should not be more than 3-4 lines. Break up long blocks of text.

PRIORITY TWO: ABHI WRITING STYLE

SECTION 1: Title Rules
- The title must be attention-grabbing AND cover the main point of the content.
- No generic, vague titles. The reader should know exactly what they'll get.
- Bad: "The Ultimate Guide to Hair Styles"
- Good: "5 Hairstyles I Personally Tried That Made My Thin Hair Look Fuller"

SECTION 2: Write for One Person
- Write as if you're talking to ONE specific person, not a crowd.
- Use "you" and "your" — never "people" or "readers" or "everyone."
- Feel like a casual conversation at a party — relaxed, genuine, no corporate tone.
- Empathize with the reader. Acknowledge their struggle before offering solutions.

SECTION 3: The "So What → Ok → That's Interesting" Structure

Every paragraph or content block must follow this progression:

1. START with the main point. Give the reader the answer immediately. No buildup, no preamble.
   - Reader thinks: "So what? Everyone says that."
   
2. FOLLOW with evidence, context, or specifics that make the claim credible.
   - Reader thinks: "Ok, that's reasonable. I believe you."
   
3. END with something that piques curiosity or delivers a surprising insight.
   - Reader thinks: "That's interesting. I want to learn more."

EXAMPLE (Cover Letter):
- Sentence 1: "I believe my experience aligns closely with what you're looking for."
  Reader: "So what, everyone says that."
- Sentence 2: "Right now, I work in the First Aid & CPR certification sector as an SEO strategist and marketing coordinator."
  Reader: "Ok, same industry. That's relevant."
- Sentence 3: "I've played a key role in boosting our online course registrations — leading to a 30% increase in revenue."
  Reader: "That's interesting. 30% increase? Tell me more."

EXAMPLE (Blog Intro):
- Bad: "Thinning hair can feel like a personal battle, but it doesn't have to define your style."
  Reader: "So what, I read this everywhere."
- Good: "I've been dealing with thin hair for the past five years, and I've finally discovered the hairstyles that really work for me."
  Reader: "Ok, you have experience. What are those hairstyles?"

SECTION 4: No Fluff Rule (NON-NEGOTIABLE)
- Get straight to the point. Every sentence must earn its place.
- No beating around the bush. No filler intros. No generic statements.
- If a sentence doesn't pass the "So what?" test from the reader's perspective, delete it.
- Lead with substance, not style. Meat first, seasoning second.
- Never start with: "In today's world...", "It's no secret that...", "Many people wonder...", "Have you ever thought about..."
- Instead start with: the actual answer, a specific claim, or a concrete detail.

SECTION 5: Empathy and Voice
- Acknowledge the reader's frustration or situation BEFORE offering solutions.
- Use personal experience when possible — "I tried this", "I found that".
- Be honest about trade-offs. Don't oversell.
- Write like a friend giving advice, not a marketer selling something.`
};

// Fetch writing styles from registry, fall back to hardcoded
let cachedWritingStyles = null;

async function fetchWritingStyles(registryUrl) {
  if (cachedWritingStyles) return cachedWritingStyles;
  if (!registryUrl) return WRITING_STYLES_FALLBACK;

  try {
    const res = await fetch(registryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: false }),
      signal: AbortSignal.timeout(5000)
    });
    const data = await res.json();
    if (data.styles && Array.isArray(data.styles)) {
      const styles = {};
      for (const s of data.styles) {
        styles[s.id] = s.instructions || '';
      }
      cachedWritingStyles = styles;
      return styles;
    }
  } catch (e) {
    // Fall back to hardcoded
  }
  return WRITING_STYLES_FALLBACK;
}

// ---------- outline prompt builder ----------

function buildOutlineUserPrompt(form, statsResult, writingStyles) {
  var parts = [];

  parts.push('<topic>\n' + (form.topic || form.focus_keyword || '(not set)') + '\n</topic>');

  if (form.writing_style && writingStyles && writingStyles[form.writing_style]) {
    parts.push('<writing_style>\n' + writingStyles[form.writing_style] + '\n</writing_style>');
  } else if (form.writing_style) {
    parts.push('<writing_style>\n' + form.writing_style + '\n</writing_style>');
  }

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
    let statsContext = statsResult.stats_block;
    if (Array.isArray(statsResult.sources) && statsResult.sources.length > 0) {
      statsContext += '\n\nAVAILABLE SOURCES (use these for [Include stat: ... — Source: <name>](<url>) tags):\n';
      for (const s of statsResult.sources) {
        statsContext += '- ' + s.title + ' | URL: ' + s.url + '\n';
      }
    }
    parts.push('<stats_context>\n' + statsContext + '\n</stats_context>');
  }

  parts.push('<marketer_inputs>\nFocus Keyword: ' + (form.focus_keyword || '(not set)') + '\nHeader Keywords: ' + ((form.header_keywords || []).join(', ') || '(not set)') + '\nEntities: ' + ((form.entities || []).join(', ') || '(not set)') + '\nCommon Keywords: ' + ((form.common_keywords || []).join(', ') || '(not set)') + '\nExtra Keywords: ' + ((form.extra_keywords || []).join(', ') || '(not set)') + '\nTarget Word Count: ' + (form.target_word_count ? form.target_word_count + ' words' : '(not set — let the topic dictate length)') + '\n</marketer_inputs>');

  parts.push('<intent_context>\n' + (form.intent_context_text || '(not provided — structure the blog based on the topic and content inputs alone)') + '\n</intent_context>');

  parts.push('<serp_context>\n' + (form.serp_context_text || '(not provided — proceed without SERP competitive intelligence)') + '\n</serp_context>');

  parts.push('<salience_context>\n' + (form.salience_context_text || '(not provided — proceed without entity-coverage guidance)') + '\n</salience_context>');

  parts.push('<audience_context>\n' + (form.audience_context_text || '(not provided — proceed without audience-research guidance)') + '\n</audience_context>');

  if (form.internal_links && form.internal_links.length > 0) {
    parts.push('<internal_links>\nAvailable internal URLs for contextual linking. Only use when the surrounding content genuinely matches the URL topic. Use the URL path to judge relevance.\n' + form.internal_links.map(u => '- ' + u).join('\n') + '\n</internal_links>');
  }

  parts.push(OUTLINE_SYSTEM_PROMPT_WORDCOUNT_ADDON + '\n\nNow produce the blog-post outline. Design the structure from scratch based on all provided context.');

  return parts.join('\n\n');
}

const CONTENT_SYSTEM_PROMPT = 'You are a senior blog editor and SEO copywriter. You write blog-post content that ranks in Google AND is quoted by LLM-based search.\n\nGROUNDING RULES:\n1. SEARCH INTENT INSIGHTS (HIGHEST PRIORITY): If <intent_context> contains content, calibrate tone, depth, and CTAs to the stated primary intent. Transactional -> buy/subscribe CTAs. Informational -> no heavy sell, focus on teaching. If a recommended page archetype is specified (listicle, guide, how-to, comparison), you MUST follow that archetype. If a modifier-SERP conflict is flagged, follow that guidance.\n2. SERP ANALYSIS (HIGHEST PRIORITY): If <serp_context> contains content, use it as authoritative competitive intelligence. Follow the SERP archetype specified. Match common patterns across top rankers. Incorporate standout signals as differentiators. Implement recommendations as content improvements. This carries the same weight as Search Intent Insights.\n3. SALIENCE INSIGHTS (SECOND HIGHEST PRIORITY): If <salience_context> contains content, weave must-cover entities naturally throughout the body copy using exact entity names.\n4. Expand every section of the provided outline into final blog copy. Do NOT add, remove, or reorder sections unless the outline explicitly signals flexibility.\n5. Under every heading, write engaging, authentic prose. H2s get 2-4 paragraphs. H3s get 1-2 paragraphs. The intro hook should grab attention in the first sentence — use a stat, a provocative statement, or a vivid anecdote as appropriate.\n6. Naturally weave in the Focus Keyword, Header Keywords, Entities, and Common Keywords. Use the Focus Keyword in the H1 and once in the opening paragraph. Use Entities where they add trust signals. Do not keyword-stuff.\n7. If the outline contains [Include anecdote: ...] tags, expand the anecdote into full narrative prose in that section. Make it personal and vivid.\n8. If the outline contains [POV: ...] tags, expand the opinion into a clear, confident position statement with supporting reasoning.\n9. If the outline contains [Include stat: ... — Source: <name>](<url>) tags, expand them into natural prose with a clickable markdown link. Use the source name as anchor text and embed the URL. Example: [Include stat: 73% of men experience hair loss — Source: HealthLine](https://healthline.com/stats) becomes "According to [HealthLine](https://healthline.com/stats), 73% of men experience hair loss." Do NOT show the raw URL to the reader — always use the clean anchor text format.\n10. If <voice_context> was provided, the entire post must read in that voice — every sentence, every transition, every takeaway. The voice is non-negotiable.\n11. For any [TO FILL] markers in the outline, leave a [TO FILL: <label>] placeholder instead of fabricating.\n12. AUDIENCE RESEARCH: If <audience_context> contains content, address the top user problems explicitly. Use the phrasing patterns from representative questions to write relatable copy.\n13. PARAGRAPH LENGTH (NON-NEGOTIABLE): Every paragraph must be a MINIMUM of 3 lines and a MAXIMUM of 4 lines. This is critical for readability — large chunks of text ruin the reading experience. If a paragraph runs longer than 4 lines, break it into two paragraphs. If a paragraph is shorter than 3 lines, expand it with supporting detail or merge it with an adjacent paragraph.\n\nFORMAT: Pure markdown. Preserve H1/H2/H3 structure exactly. No preamble, no trailing commentary, no code fences.\n\nTONE: Match the provided voice exactly. If no voice provided, default to conversational, authoritative, and benefit-driven. Short sentences. No filler phrases. No fluff.\n14. INTERNAL LINKING: If <internal_links> is provided, identify 3-5 places in the content where internal links are contextually relevant. Insert them as markdown links: [descriptive anchor text](URL). Anchor text must be natural, descriptive, and match the linked page topic. Only use a link when the surrounding content genuinely relates to that URL. Never force irrelevant links. Skip a link if no section is a good fit.';

function buildContentUserPrompt(form, writingStyles) {
  var parts = [];

  parts.push('<marketer_inputs>\nFocus Keyword: ' + (form.focus_keyword || '(not set)') + '\nHeader Keywords: ' + ((form.header_keywords || []).join(', ') || '(not set)') + '\nEntities: ' + ((form.entities || []).join(', ') || '(not set)') + '\nCommon Keywords: ' + ((form.common_keywords || []).join(', ') || '(not set)') + '\nExtra Keywords: ' + ((form.extra_keywords || []).join(', ') || '(not set)') + '\nTarget Word Count: ' + (form.target_word_count ? form.target_word_count + ' words' : '(not set — let outline depth dictate length)') + '\n</marketer_inputs>');

  parts.push('<intent_context>\n' + (form.intent_context_text || '(not provided — expand the outline as written without intent calibration)') + '\n</intent_context>');

  parts.push('<serp_context>\n' + (form.serp_context_text || '(not provided — expand without SERP competitive intelligence)') + '\n</serp_context>');

  parts.push('<salience_context>\n' + (form.salience_context_text || '(not provided — expand without entity-coverage guidance)') + '\n</salience_context>');

  parts.push('<audience_context>\n' + (form.audience_context_text || '(not provided — write without specific audience-pain calibration)') + '\n</audience_context>');

  parts.push('<edited_outline>\n' + form.edited_outline + '\n</edited_outline>');

  if (form.internal_links && form.internal_links.length > 0) {
    parts.push('<internal_links>\nAvailable internal URLs for contextual linking. Only place a link when the surrounding content genuinely matches the URL topic. Use the URL path to judge relevance. Insert links naturally using markdown format: [anchor text](URL). Anchor text must be descriptive and match the linked page topic.\n' + form.internal_links.map(u => '- ' + u).join('\n') + '\n</internal_links>');
  }

  if (form.writing_style && writingStyles && writingStyles[form.writing_style]) {
    parts.push('<writing_style>\n' + writingStyles[form.writing_style] + '\n</writing_style>');
  } else if (form.writing_style) {
    parts.push('<writing_style>\n' + form.writing_style + '\n</writing_style>');
  }

  if (form.target_word_count) {
    parts.push('IMPORTANT: Aim for approximately ' + form.target_word_count + ' words. Adjust section depth — do not pad or repeat. Each H2 section should contribute proportionally to the total.');
  }

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

  var statsResult = null;
  if (form.stats_enabled) {
    statsResult = await fetchStats(form.topic, form.focus_keyword);
  }

  const writingStyles = await fetchWritingStyles(form.writing_styles_webhook);

  const resp = await chat({
    model: OUTLINE_MODEL,
    messages: [
      { role: 'system', content: OUTLINE_SYSTEM_PROMPT },
      { role: 'user', content: buildOutlineUserPrompt(form, statsResult, writingStyles) },
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
      target_word_count: form.target_word_count,
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
      sources: statsResult.sources || [],
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

  const writingStyles = await fetchWritingStyles(form.writing_styles_webhook);

  const resp = await chat({
    model: form.model || CONTENT_MODEL,
    messages: [
      { role: 'system', content: CONTENT_SYSTEM_PROMPT },
      { role: 'user', content: buildContentUserPrompt(form, writingStyles) },
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
      target_word_count: form.target_word_count,
    },
    content: cleaned,
    model: form.model || CONTENT_MODEL,
    stats: { word_count: wordCount, h1: h1Count, h2: h2Count, h3: h3Count },
    usage: resp.usage || null,
    generated_at: new Date().toISOString(),
  });
}

module.exports = { handleOutline, handleContent, handleTldr };

// ---------- TL;DR handler ----------

const TLDR_SYSTEM_PROMPT = `You are a semantic SEO analyst. Given a blog post's topic and its full content, extract 5-10 semantic triples that directly answer the blog topic, plus a one-sentence TL;DR summary.

A semantic triple has three parts:
- Subject: the entity or concept being described
- Predicate: the relationship or action
- Object: the value, entity, or concept linked to the subject

Examples of good triples:
- "Tesla → produces → Electric Cars"
- "Semantic Search → improves → User Experience"
- "Python → isUsedFor → AI Development"

RULES:
1. Every triple must be a factual claim directly supported by the content.
2. If the topic is a question, the triples must answer it. If the topic is a statement, the triples must elaborate it.
3. Use concise, specific language. Avoid vague predicates like "is related to". Prefer definitive predicates: "improves", "enables", "reduces", "requires", "produces", "increases", "decreases", "powers", "supports", "replaces", "outperforms", "leverages".
4. Each Subject should be a recognizable entity or concept from the content — not a generic pronoun.
5. The tldr_summary must be a single direct sentence answering the topic. No hedging, no "In summary" preface. Subject-Predicate-Object format preferred.
6. Extract 5-10 triples. Focus on the most important and distinctive claims from the content.
7. Order triples from most fundamental/definitional to most specific/nuanced.

OUTPUT: Valid JSON only. No markdown code fences. No prose outside JSON. Schema exactly:
{
  "tldr_summary": "A single direct sentence answering the topic in subject-predicate-object form.",
  "tldr_triples": [
    { "subject": "...", "predicate": "...", "object": "..." }
  ]
}`;

function normalizeTldrInput(rawBody) {
  const form = unwrapBody(rawBody);
  const p = (...k) => pickFromForm(form, ...k);
  return {
    topic: p('topic', 'Topic') || '',
    focus_keyword: p('focus_keyword', 'Focus Keyword', 'focusKeyword') || '',
    content: p('content', 'Content', 'edited_outline') || '',
  };
}

async function handleTldr(req, res) {
  const rawBody = req.body || {};

  if (rawBody.test === true || (rawBody.body && rawBody.body.test === true)) {
    return res.json({
      ok: true,
      message: 'TL;DR webhook reachable',
      received_at: new Date().toISOString(),
    });
  }

  const form = normalizeTldrInput(rawBody);

  if (!form.content) {
    return res.status(400).json({ error: 'content is required (the blog post markdown).' });
  }

  const topicLabel = form.topic || form.focus_keyword || 'the topic';

  const userPrompt = `TOPIC: ${topicLabel}

Below is the full blog post content. Extract 5-10 semantic triples (Subject → Predicate → Object) that directly answer the topic, plus a one-sentence TL;DR summary.

<content>
${form.content}
</content>

Return the JSON now.`;

  const resp = await chat({
    model: TLDR_MODEL,
    messages: [
      { role: 'system', content: TLDR_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    responseFormat: 'json_object',
    timeoutMs: 60000,
    title: 'Blog Post Creation :: TL;DR',
  });

  const parsed = parseChatJson(resp);
  if (parsed.error) {
    return res.status(502).json({
      error: parsed.error,
      raw_text: parsed.raw_text,
      raw: parsed.raw,
    });
  }

  const result = parsed.json || {};
  if (!Array.isArray(result.tldr_triples)) {
    result.tldr_triples = [];
  }
  if (!result.tldr_summary) {
    result.tldr_summary = '';
  }

  return res.json({
    tldr_summary: result.tldr_summary,
    tldr_triples: result.tldr_triples,
    model: TLDR_MODEL,
    usage: resp.usage || null,
    generated_at: new Date().toISOString(),
  });
}

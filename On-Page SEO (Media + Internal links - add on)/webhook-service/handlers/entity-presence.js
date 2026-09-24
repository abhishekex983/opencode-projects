// Entity Presence handler — port of the n8n "Entity Presence -- Report Generator"
// workflow (ranking-report-workflow.json). Same request shape, same response
// shape as the live n8n webhook so the only client change is the URL.

const { dfsPost } = require('../util/dataforseo');
const { kgSearch, placesTextSearch, geocode } = require('../util/google');
const { enrich: neuronEnrich } = require('../util/neuronwriter');
const { generateJson, parseGeminiJson } = require('../util/gemini');
const { requestJson } = require('../util/http');

// ---------- small helpers ----------

const tryHost = (url) => {
  if (!url) return '';
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); }
  catch {
    return String(url).replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
  }
};

const haversine = (a, b) => {
  if (!a || !b || a.lat == null || b.lat == null) return null;
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

// Mirrors the n8n "Normalize Form" node: accept both Form-Trigger-style
// payloads (keyed by fieldLabel) and webhook bodies (keyed by fieldName).
function normalizeForm(rawBody) {
  const wrapped = rawBody && typeof rawBody.body === 'object' && rawBody.body !== null && Object.keys(rawBody.body).length > 0;
  const form = wrapped ? rawBody.body : (rawBody || {});

  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  const pick = (...keys) => {
    for (const k of keys) {
      if (form[k] !== undefined && form[k] !== null && form[k] !== '') return form[k];
    }
    const targets = keys.map(norm);
    for (const k of Object.keys(form)) {
      const n = norm(k);
      if (targets.some((t) => n === t || n.startsWith(t))) return form[k];
    }
    return '';
  };

  let competitorsRaw = pick('competitors', 'competitors_json', 'Named Competitors');
  let competitors = [];
  if (Array.isArray(competitorsRaw)) {
    competitors = competitorsRaw;
  } else if (typeof competitorsRaw === 'string' && competitorsRaw.trim()) {
    try { competitors = JSON.parse(competitorsRaw); } catch { competitors = []; }
  }
  competitors = (Array.isArray(competitors) ? competitors : [])
    .map((c) => ({ name: String(c.name || '').trim(), url: String(c.url || '').trim() }))
    .filter((c) => c.name || c.url)
    .slice(0, 5);

  return {
    search_term: pick('search_term', 'Search Term', 'searchTerm'),
    location: pick('location', 'Location'),
    target_business_name: pick('target_business_name', 'Target Business Name', 'targetBusinessName'),
    target_website: pick('target_website', 'Target Website', 'targetWebsite') || '',
    competitors,
    neuronwriter_api_key: pick('neuronwriter_api_key', 'NeuronWriter API Key', 'neuronwriterApiKey') || '',
    neuronwriter_project_id: pick('neuronwriter_project_id', 'NeuronWriter Project ID', 'neuronwriterProjectId') || '',
    _raw_form: form,
  };
}

// ---------- competitor enrichment ----------
// Direct port of the n8n Code-node "Competitor Enrichment". Builds a unified
// competitor list from (a) user-supplied rivals and (b) SERP organic/local-pack
// winners, then bulk-fetches DFS rank + referring domains and per-competitor
// KG + Places + (user only) on_page parsing in parallel.

async function enrichCompetitors({ form, serpRaw, placesRaw }) {
  const userList = (form.competitors || [])
    .map((c) => ({
      source: 'user',
      name: (c.name || '').trim(),
      url: (c.url || '').trim(),
      domain: tryHost(c.url),
    }))
    .filter((c) => c.name || c.url)
    .slice(0, 5);

  const dfsItems = (serpRaw && serpRaw.tasks && serpRaw.tasks[0] && serpRaw.tasks[0].result && serpRaw.tasks[0].result[0] && serpRaw.tasks[0].result[0].items) || [];

  const topOrganic = dfsItems
    .filter((i) => i.type === 'organic')
    .slice(0, 3)
    .map((i) => ({
      source: 'serp',
      name: i.title,
      url: i.url,
      domain: (i.domain || tryHost(i.url) || '').replace(/^www\./, '').toLowerCase(),
      serp_position: i.rank_absolute,
      serp_snippet: i.description,
    }));

  const localPack = dfsItems
    .filter((i) => i.type === 'local_pack')
    .slice(0, 3)
    .map((p) => ({
      source: 'serp_local_pack',
      name: p.title,
      url: p.url,
      domain: tryHost(p.url),
      serp_position: p.rank_absolute,
      local_pack_rating: p.rating && p.rating.value,
      local_pack_rating_count: p.rating && p.rating.votes_count,
      cid: p.cid,
    }));

  const seen = new Set();
  const competitors = [];
  const pushIfNew = (c) => {
    const key = (c.domain || c.name || '').toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    competitors.push(c);
  };
  userList.forEach(pushIfNew);
  topOrganic.forEach(pushIfNew);
  localPack.forEach(pushIfNew);

  const targetDomain = tryHost(form.target_website);
  const targetPlace = (placesRaw && placesRaw.places && placesRaw.places[0]) || null;
  const targetLatLng = targetPlace && targetPlace.location
    ? { lat: targetPlace.location.latitude, lng: targetPlace.location.longitude }
    : null;

  // Geocode search center (non-fatal if it fails)
  let searchCenter = null;
  try {
    const geoRes = await geocode(form.location);
    const loc = geoRes && geoRes.results && geoRes.results[0] && geoRes.results[0].geometry && geoRes.results[0].geometry.location;
    if (loc) {
      searchCenter = { lat: loc.lat, lng: loc.lng, formatted: geoRes.results[0].formatted_address };
    }
  } catch { /* non-fatal */ }

  // Bulk DataForSEO calls for all domains
  const allDomains = [...new Set([targetDomain, ...competitors.map((c) => c.domain)].filter(Boolean))];

  const [bulkRanksRes, bulkRefRes] = await Promise.all([
    allDomains.length
      ? dfsPost('/backlinks/bulk_ranks/live', [{ targets: allDomains }]).catch(() => null)
      : Promise.resolve(null),
    allDomains.length
      ? dfsPost('/backlinks/bulk_referring_domains/live', [{ targets: allDomains }]).catch(() => null)
      : Promise.resolve(null),
  ]);

  const rankMap = {};
  const refMap = {};
  const ranksItems = (bulkRanksRes && bulkRanksRes.tasks && bulkRanksRes.tasks[0] && bulkRanksRes.tasks[0].result && bulkRanksRes.tasks[0].result[0] && bulkRanksRes.tasks[0].result[0].items) || [];
  ranksItems.forEach((i) => { rankMap[i.target] = i.rank; });
  const refItems = (bulkRefRes && bulkRefRes.tasks && bulkRefRes.tasks[0] && bulkRefRes.tasks[0].result && bulkRefRes.tasks[0].result[0] && bulkRefRes.tasks[0].result[0].items) || [];
  refItems.forEach((i) => { refMap[i.target] = i.referring_domains; });

  // Per-competitor: KG + Places + (user only) on-page parsing in parallel
  const enrichOne = async (c) => {
    const enriched = { ...c };
    enriched.dataforseo_rank = c.domain ? (rankMap[c.domain] != null ? rankMap[c.domain] : null) : null;
    enriched.referring_domains = c.domain ? (refMap[c.domain] != null ? refMap[c.domain] : null) : null;

    const [kgRes, placesRes, opRes] = await Promise.all([
      c.name ? kgSearch(`${c.name} ${form.location}`).catch(() => null) : Promise.resolve(null),
      c.name ? placesTextSearch(`${c.name} ${form.location}`).catch(() => null) : Promise.resolve(null),
      (c.source === 'user' && c.url)
        ? dfsPost('/on_page/content_parsing/live', [{ url: c.url }]).catch(() => null)
        : Promise.resolve(null),
    ]);

    const kgItem = kgRes && kgRes.itemListElement && kgRes.itemListElement[0] && kgRes.itemListElement[0].result;
    enriched.kg = kgItem ? {
      name: kgItem.name,
      type: kgItem['@type'],
      description: kgItem.description,
      detailedDescription: kgItem.detailedDescription && kgItem.detailedDescription.articleBody,
    } : null;

    const place = (placesRes && placesRes.places && placesRes.places[0]) || null;
    if (place) {
      enriched.gbp = {
        displayName: place.displayName && place.displayName.text,
        formattedAddress: place.formattedAddress,
        shortFormattedAddress: place.shortFormattedAddress,
        rating: place.rating,
        userRatingCount: place.userRatingCount,
        primaryType: place.primaryType,
        types: place.types,
        websiteUri: place.websiteUri,
        hours: place.regularOpeningHours && place.regularOpeningHours.weekdayDescriptions,
        photoCount: (place.photos || []).length,
        priceLevel: place.priceLevel,
        attributes: {
          paymentOptions: place.paymentOptions,
          parkingOptions: place.parkingOptions,
          accessibilityOptions: place.accessibilityOptions,
          goodForChildren: place.goodForChildren,
          goodForGroups: place.goodForGroups,
          reservable: place.reservable,
        },
        businessStatus: place.businessStatus,
        location: place.location ? { lat: place.location.latitude, lng: place.location.longitude } : null,
      };
    } else {
      enriched.gbp = null;
    }

    enriched.distance_from_search_center_km = (searchCenter && enriched.gbp && enriched.gbp.location)
      ? Math.round(haversine(searchCenter, enriched.gbp.location) * 10) / 10
      : null;

    if (opRes) {
      const item0 = opRes.tasks && opRes.tasks[0] && opRes.tasks[0].result && opRes.tasks[0].result[0] && opRes.tasks[0].result[0].items && opRes.tasks[0].result[0].items[0];
      const page = (item0 && item0.page_content) || {};
      const meta = (item0 && item0.meta) || {};
      enriched.on_page = {
        title: meta.title || page.title,
        meta_description: meta.description || (page.meta && page.meta.description),
        h1: (page.header && page.header.h1 && page.header.h1[0]) || (meta.htags && meta.htags.h1 && meta.htags.h1[0]) || null,
        h2: ((page.header && page.header.h2) || (meta.htags && meta.htags.h2) || []).slice(0, 15),
        h3_count: ((page.header && page.header.h3) || (meta.htags && meta.htags.h3) || []).length,
        word_count: (meta.content && meta.content.plain_text_word_count) || page.word_count || null,
      };
    } else {
      enriched.on_page = null;
    }

    return enriched;
  };

  const enrichedCompetitors = await Promise.all(competitors.map(enrichOne));

  const targetDistance = (searchCenter && targetLatLng)
    ? Math.round(haversine(searchCenter, targetLatLng) * 10) / 10
    : null;

  return {
    competitors: enrichedCompetitors,
    target: {
      domain: targetDomain,
      dataforseo_rank: targetDomain ? (rankMap[targetDomain] != null ? rankMap[targetDomain] : null) : null,
      referring_domains: targetDomain ? (refMap[targetDomain] != null ? refMap[targetDomain] : null) : null,
      location: targetLatLng,
      distance_from_search_center_km: targetDistance,
    },
    search_center: searchCenter,
    count: {
      user: userList.length,
      serp: enrichedCompetitors.length - userList.filter((u) => seen.has((u.domain || u.name).toLowerCase())).length,
      total: enrichedCompetitors.length,
    },
  };
}

// ---------- prune raw API responses for the prompt ----------

function pruneKg(kgRaw) {
  const item = (kgRaw && kgRaw.itemListElement && kgRaw.itemListElement[0]) || null;
  if (!item) return { note: 'No KG entity found' };
  return {
    name: item.result && item.result.name,
    type: item.result && item.result['@type'],
    description: item.result && item.result.description,
    detailedDescription: item.result && item.result.detailedDescription && item.result.detailedDescription.articleBody,
    url: item.result && item.result.url,
    resultScore: item.resultScore,
  };
}

function pruneGbp(placesRaw, enrichmentTarget, searchCenter) {
  const place = (placesRaw && placesRaw.places && placesRaw.places[0]) || {};
  return {
    displayName: place.displayName && place.displayName.text,
    formattedAddress: place.formattedAddress,
    shortFormattedAddress: place.shortFormattedAddress,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    types: place.types,
    primaryType: place.primaryType,
    websiteUri: place.websiteUri,
    hours: place.regularOpeningHours && place.regularOpeningHours.weekdayDescriptions,
    editorialSummary: place.editorialSummary && place.editorialSummary.text,
    photoCount: (place.photos || []).length,
    priceLevel: place.priceLevel,
    businessStatus: place.businessStatus,
    attributes: {
      paymentOptions: place.paymentOptions,
      parkingOptions: place.parkingOptions,
      accessibilityOptions: place.accessibilityOptions,
      goodForChildren: place.goodForChildren,
      goodForGroups: place.goodForGroups,
      reservable: place.reservable,
    },
    dataforseo_domain_rank: (enrichmentTarget && enrichmentTarget.dataforseo_rank) != null ? enrichmentTarget.dataforseo_rank : null,
    referring_domains: (enrichmentTarget && enrichmentTarget.referring_domains) != null ? enrichmentTarget.referring_domains : null,
    distance_from_search_center_km: (enrichmentTarget && enrichmentTarget.distance_from_search_center_km) != null ? enrichmentTarget.distance_from_search_center_km : null,
    search_center_address: (searchCenter && searchCenter.formatted) || null,
  };
}

function pruneSerp(serpRaw) {
  const dfsResult = serpRaw && serpRaw.tasks && serpRaw.tasks[0] && serpRaw.tasks[0].result && serpRaw.tasks[0].result[0];
  const items = (dfsResult && dfsResult.items) || [];

  const organic = items
    .filter((i) => i.type === 'organic')
    .slice(0, 10)
    .map((r) => ({
      position: r.rank_absolute,
      title: r.title,
      link: r.url,
      snippet: r.description,
      domain: r.domain,
    }));

  const localPack = items
    .filter((i) => i.type === 'local_pack')
    .slice(0, 3)
    .map((p) => ({
      title: p.title,
      description: p.description,
      rating: p.rating && p.rating.value,
      ratingCount: p.rating && p.rating.votes_count,
      url: p.url,
      cid: p.cid,
    }));

  const knowledgeGraph = items.find((i) => i.type === 'knowledge_graph') || null;
  const answerBox = items.find((i) => i.type === 'answer_box') || items.find((i) => i.type === 'featured_snippet') || null;
  const aiOverviewItem = items.find((i) => i.type === 'ai_overview');
  const aiOverview = aiOverviewItem ? { text: aiOverviewItem.text, references: aiOverviewItem.references } : null;
  const paaItem = items.find((i) => i.type === 'people_also_ask');
  const peopleAlsoAsk = paaItem ? (paaItem.items || []).slice(0, 5).map((q) => q.title) : [];
  const relatedItem = items.find((i) => i.type === 'related_searches');
  const relatedSearches = relatedItem ? (relatedItem.items || []).slice(0, 5) : [];

  return {
    organic,
    localPack,
    knowledgeGraph,
    answerBox,
    aiOverview,
    peopleAlsoAsk,
    relatedSearches,
    serpFeaturesPresent: [...new Set(items.map((i) => i.type))],
  };
}

// ---------- prompts ----------

const SYSTEM_PROMPT = `You are a senior local search analyst. Your job is to produce an actionable ranking plan -- not a description, not a summary -- for a specific business trying to rank for a specific search term in a specific location.

GROUNDING RULES (non-negotiable):
1. Only use facts present in the <data> blocks. If a fact is not in the data, write "not available in provided data" -- do not infer or estimate.
2. Every claim must cite a source: [KG], [GBP], [SERP], [COMPETITOR:N] (N is the 1-based index in the COMPETITORS array), or [NEURON].
3. If data sources contradict, treat live sources (GBP, SERP, COMPETITORS) as truth and flag the discrepancy.
4. Do not recommend any action that cannot be justified by a specific gap in the data. If you cannot justify an action, do not include it.
5. The COMPETITORS array includes both user-supplied rivals (source='user') and SERP-discovered winners (source='serp' or 'serp_local_pack'). User-supplied competitors are strategically important even if they don't currently rank; SERP competitors prove what Google rewards. Use BOTH lenses.

ANALYSIS FRAMEWORK:
- Infer search intent from SERP features.
- Identify SERP features present and which ones the target does not appear in.
- For competitive_gaps, compare target's GBP/website signals against the COMPETITORS array. Use concrete numbers: domain rank (dataforseo_rank, scale 0-1000), referring_domains, userRatingCount, photoCount, distance_from_search_center_km, attribute presence (paymentOptions/parkingOptions/etc), on_page headings + word_count where available.
- Distance: if target's distance_from_search_center_km is materially higher than competitors', call this out as a structural geographic gap.
- Classify gaps: 30 days (reviews, photos, posts, GBP attributes), 90 days (content, citations, on-page schema, headings), structural (domain rank/referring domains gap, category change, location).

NEURON ADD-ON: If NEURON data is present (non-empty object), populate content_suggestions with up to 10 items drawn from NEURON headings, terms, entities, and article_queries. Pick items that address visible gaps in SERP features, competitor coverage, or intent coverage. Cite [NEURON]. If NEURON data reads 'not enabled', return content_suggestions as an empty array and do not reference NEURON anywhere.

TONE: Direct, prescriptive, no hedging. Avoid "consider", "might", "could". Use "do X because Y shows Z".

OUTPUT: Valid JSON only. No prose outside the JSON. No markdown code fences.`;

function buildUserPrompt({ form, kg, gbp, serp, enrichment, neuron }) {
  return `SEARCH TERM: ${form.search_term}
LOCATION: ${form.location}
TARGET BUSINESS: ${form.target_business_name}
TARGET WEBSITE: ${form.target_website}

<data source="KG">
${JSON.stringify(kg, null, 2)}
</data>

<data source="GBP">
${JSON.stringify(gbp, null, 2)}
</data>

<data source="SERP">
${JSON.stringify(serp, null, 2)}
</data>

<data source="COMPETITORS" note="Indexed array; cite specific competitors with [COMPETITOR:N] using the 1-based index.">
${JSON.stringify(enrichment.competitors || [], null, 2)}
</data>

<data source="NEURON" note="Optional add-on. If body reads 'not enabled', do not cite NEURON and leave content_suggestions empty.">
${neuron ? JSON.stringify(neuron, null, 2) : 'not enabled'}
</data>

Produce a ranking plan as valid JSON matching this exact schema:
{
  "search_term": "string",
  "search_intent": "informational | transactional | local | commercial",
  "serp_features_present": ["array of strings"],
  "target_current_visibility": {
    "ranks_in_local_pack": "boolean or rank position",
    "ranks_in_organic_top_10": "boolean or rank position",
    "appears_in_knowledge_panel": "boolean",
    "visibility_summary": "one sentence with citations"
  },
  "competitive_gaps": [
    { "gap": "string", "evidence": "string with concrete numbers from COMPETITORS / GBP / SERP", "citation": "[COMPETITOR:N] or [SERP] or [GBP]" }
  ],
  "data_discrepancies": [
    { "field": "string", "kg_value": "string", "live_value": "string", "action": "string" }
  ],
  "prioritized_actions": [
    { "action": "string", "priority": "P0|P1|P2", "effort": "low|medium|high", "expected_impact": "string", "evidence_basis": "string", "timeframe": "this week|30 days|90 days|structural" }
  ],
  "quick_wins": ["top 3 P0 low-effort actions verbatim"],
  "content_suggestions": [
    { "suggestion": "string", "type": "heading|term|entity|query", "citation": "[NEURON]", "rationale": "one sentence tying to a specific gap in target coverage" }
  ],
  "cannot_assess": ["questions needing more data -- do NOT list items already covered by COMPETITORS (domain rank, referring domains, GBP attributes, distance) or by NEURON"]
}

Return only JSON.`;
}

// ---------- handler ----------

async function handle(req, res) {
  const rawBody = req.body || {};

  // Test-mode short-circuit: matches the n8n "Is Test?" node so the dashboard's
  // Test button doesn't burn API credits.
  if (rawBody.test === true || (rawBody.body && rawBody.body.test === true)) {
    return res.json({
      ok: true,
      message: 'Webhook reachable',
      received_at: new Date().toISOString(),
    });
  }

  const form = normalizeForm(rawBody);

  if (!form.search_term || !form.location || !form.target_business_name) {
    return res.status(400).json({
      error: 'search_term, location, and target_business_name are required.',
      received: form._raw_form,
    });
  }

  // Stage 1: target lookups, SERP, NeuronWriter (the slow one) all start in parallel.
  // NeuronWriter polls for up to ~3 minutes, so kicking it off early hides the latency.
  const [kgRaw, placesRaw, serpRaw, neuronOut] = await Promise.all([
    kgSearch(`${form.target_business_name} ${form.location}`),
    placesTextSearch(`${form.target_business_name} ${form.location}`),
    dfsPost('/serp/google/organic/live/advanced', [{
      keyword: form.search_term,
      location_name: form.location,
      language_code: 'en',
      device: 'desktop',
      depth: 20,
    }]),
    neuronEnrich({
      apiKey: form.neuronwriter_api_key,
      projectId: form.neuronwriter_project_id,
      keyword: form.search_term,
    }),
  ]);

  // Stage 2: competitor enrichment depends on SERP + Places results.
  const enrichment = await enrichCompetitors({ form, serpRaw, placesRaw });

  // Stage 3: prune and build the Gemini prompt.
  const kg = pruneKg(kgRaw);
  const gbp = pruneGbp(placesRaw, enrichment.target, enrichment.search_center);
  const serp = pruneSerp(serpRaw);
  const neuron = neuronOut.neuronwriter;
  const neuronStatus = neuronOut.neuronwriter_status;

  const userPrompt = buildUserPrompt({ form, kg, gbp, serp, enrichment, neuron });

  // Stage 4: call Gemini.
  const geminiResp = await generateJson({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    temperature: 0.2,
    timeoutMs: 60000,
  });

  const parsed = parseGeminiJson(geminiResp);
  if (parsed.error) {
    return res.status(502).json({
      error: parsed.error,
      raw_text: parsed.raw_text,
      raw: parsed.raw,
    });
  }

  return res.json({
    request: {
      search_term: form.search_term,
      location: form.location,
      target_business_name: form.target_business_name,
      target_website: form.target_website,
    },
    plan: parsed.plan,
    neuronwriter: neuron,
    neuronwriter_status: neuronStatus,
    competitor_enrichment: enrichment,
    target_enrichment: enrichment.target,
    target_gbp: gbp,
    generated_at: new Date().toISOString(),
  });
}

module.exports = { handle };

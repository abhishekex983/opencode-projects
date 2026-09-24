// Link Gap Analysis handler — two modes:
//   1) SERP gap: for a keyword, pull the top-10 organic pages and compare
//      their referring domains against the user's domain.
//   2) Competitor gap: compare the user's domain against up to 5 competitor
//      root domains.
//
// In both modes the response contains:
//   - the union "competitor pool" of referring domains with a frequency count
//   - missing / shared / mine-only buckets
//   - per-domain authority snapshot (rank, RD, backlinks, spam score)
//   - link-type distribution
//   - prioritised opportunities with priority/difficulty scores
//   - AI strategy insights (when OPENROUTER_API_KEY is set)

const { dfsPost } = require('../util/dataforseo');
const { requestJson } = require('../util/http');
const { normalizeDomain, fmtNum } = require('../util/domain');

// ─── Link-type classifier ─────────────────────────────────────────────────────
//
// Pure heuristic from the referring domain (+ optional sample URL/anchor).
// Categories match the PRP: Guest post, Editorial, Niche edit, Directory,
// Resource page, Forum, PR, SaaS/Tool listing, Local citation, EDU/GOV,
// Web 2.0, Community, Industry blog.

const TYPE_PATTERNS = [
  { type: 'EDU',              test: (d) => /\.edu(\.[a-z]{2,3})?$/.test(d) },
  { type: 'GOV',              test: (d) => /\.gov(\.[a-z]{2,3})?$/.test(d) },
  { type: 'SaaS/Tool Listing',test: (d) => /^(g2|capterra|getapp|trustradius|softwareadvice|saashub|producthunt|alternativeto|saaslist|saasworthy|crozdesk|sourceforge|slant)\./.test(d) },
  { type: 'PR',               test: (d) => /^(prnewswire|prweb|businesswire|globenewswire|prlog|einpresswire|openpr|pr|24-7pressrelease|releasewire|pressreleasepoint)\./.test(d) },
  { type: 'Web 2.0',          test: (d) => /(medium|blogger|wordpress|wix|weebly|tumblr|substack|ghost|squarespace|jimdo|webnode)\.com$/.test(d) },
  { type: 'Community',        test: (d) => /(reddit|quora|stackexchange|stackoverflow|hackernews|news\.ycombinator|indiehackers|dev\.to|hashnode|discord|slack)/.test(d) },
  { type: 'Forum',            test: (d) => /(forum|community|board|discuss|talk\.|forums\.)/.test(d) },
  { type: 'Local Citation',   test: (d) => /(yelp|yellowpages|bbb\.org|foursquare|tripadvisor|justdial|sulekha|manta|citysearch|merchantcircle)/.test(d) },
  { type: 'Directory',        test: (d) => /(directory|listings?|dir\.|catalog|hub\.)/.test(d) },
  { type: 'Editorial',        test: (d) => /(news|times|post|herald|chronicle|tribune|gazette|magazine|today|wired|forbes|techcrunch|cnn|bbc|reuters|bloomberg)/.test(d) },
];

function classifyLink(refDomain, sampleUrl) {
  const d = (refDomain || '').toLowerCase();
  if (!d) return 'Industry Blog';
  for (const p of TYPE_PATTERNS) {
    if (p.test(d)) return p.type;
  }
  if (sampleUrl) {
    const u = sampleUrl.toLowerCase();
    if (/\/(resources?|links?|useful|tools|recommend|partners?)\//.test(u)) return 'Resource Page';
    if (/\/(guest-post|guest-author|contribut|by\/|author\/)/.test(u)) return 'Guest Post';
  }
  return 'Other';
}

// ─── DataforSEO wrappers ──────────────────────────────────────────────────────

async function fetchSerpResults(keyword, locationCode, languageCode, device, maxResults = 20) {
  const raw = await dfsPost('/serp/google/organic/live/advanced', [
    {
      keyword,
      location_code: locationCode,
      language_code: languageCode || 'en',
      device: device || 'desktop',
      depth: 20,
    },
  ]);
  const items =
    (raw && raw.tasks && raw.tasks[0] && raw.tasks[0].result &&
      raw.tasks[0].result[0] && raw.tasks[0].result[0].items) || [];
  return items
    .filter((it) => it.type === 'organic' && it.url)
    .slice(0, maxResults)
    .map((it) => ({
      rank: it.rank_absolute || it.rank_group,
      url: it.url,
      domain: normalizeDomain(it.domain || it.url),
      title: it.title || '',
      description: (it.description || '').slice(0, 200),
    }));
}

async function fetchReferringDomains(target, limit, offset) {
  const raw = await dfsPost('/backlinks/referring_domains/live', [
    {
      target,
      limit: limit || 200,
      offset: offset || 0,
      mode: 'as_is',
      order_by: ['rank,desc'],
      include_subdomains: true,
    },
  ]);
  const items =
    (raw && raw.tasks && raw.tasks[0] && raw.tasks[0].result &&
      raw.tasks[0].result[0] && raw.tasks[0].result[0].items) || [];
  return items.map((it) => ({
    domain: normalizeDomain(it.domain || ''),
    rank: it.rank !== undefined ? Math.round(it.rank / 10) : 0,
    backlinks: it.backlinks || 0,
    referring_pages: it.referring_pages || 0,
    first_seen: it.first_seen || '',
    lost_date: it.lost_date || null,
    is_lost: !!it.lost_date,
    sample_url: it.url_from || '',
    dfs_spam_score: (typeof it.backlinks_spam_score === 'number') ? it.backlinks_spam_score : null,
  })).filter((x) => x.domain);
}

// ─── Spam detection: TLD + PBN-cluster + composite score ────────────────────
const SUSPICIOUS_TLDS = new Set(['xyz','top','click','space','website','site','online','info','tk','ml','ga','cf','gq','work','live','men','party','date','review','stream','download','science','racing','win','loan','cricket','accountant','faith','trade','bid','press']);

function tldOf(d) {
  if (!d) return '';
  const parts = d.split('.');
  return parts.length < 2 ? '' : parts[parts.length - 1].toLowerCase();
}

function detectPbnClusters(domains) {
  const clusterOf = {};
  const prefixCounts = {};
  for (const d of domains) {
    const name = d.split('.')[0];
    const parts = name.split('-');
    let key;
    if (parts.length >= 2) {
      const k2 = parts[0] + '-' + parts[1];
      if (k2.length >= 6) key = k2;
    }
    if (!key) {
      const k1 = name.slice(0, 8);
      if (k1.length >= 6) key = k1;
    }
    if (!key) continue;
    prefixCounts[key] = (prefixCounts[key] || 0) + 1;
    clusterOf[d] = key;
  }
  const flagged = {};
  for (const d of Object.keys(clusterOf)) {
    const k = clusterOf[d];
    if (prefixCounts[k] >= 5) flagged[d] = { cluster_key: k, cluster_size: prefixCounts[k] };
  }
  return flagged;
}

function computeSpam(opp, pbnFlagged) {
  const signals = [];
  let score = 0;
  if (typeof opp.dfs_spam_score === 'number' && opp.dfs_spam_score >= 0) {
    score += opp.dfs_spam_score;
    if (opp.dfs_spam_score >= 30) signals.push(`DataforSEO spam ${opp.dfs_spam_score}/100`);
  }
  const tld = tldOf(opp.domain);
  if (tld && SUSPICIOUS_TLDS.has(tld)) {
    score += 20;
    signals.push('.' + tld + ' TLD');
  }
  const pbn = pbnFlagged[opp.domain];
  if (pbn) {
    score += 30;
    signals.push(`PBN cluster (${pbn.cluster_size} similar domains)`);
  }
  return { spam_score: Math.min(100, Math.round(score)), spam_signals: signals };
}

// ─── Niche meta + AI relevance ──────────────────────────────────────────────
async function fetchMeta(url) {
  const html = await requestText({
    method: 'GET',
    url,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)' },
    timeoutMs: 12000,
  });
  if (!html) return { title: '', description: '' };
  const tm = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
  const title = tm ? tm[1].trim() : '';
  const mm =
    html.match(/name=["']description["'][^>]*content=["']([^"']{1,400})["']/i) ||
    html.match(/content=["']([^"']{1,400})["'][^>]*name=["']description["']/i) ||
    html.match(/property=["']og:description["'][^>]*content=["']([^"']{1,400})["']/i);
  return { title, description: mm ? mm[1].trim() : '' };
}

// Parallel meta-fetch for an array of domains, capped concurrency.
async function fetchMetaBatch(domains, concurrency = 8) {
  const out = {};
  let idx = 0;
  async function worker() {
    while (true) {
      const i = idx++;
      if (i >= domains.length) return;
      try { out[domains[i]] = await fetchMeta('https://' + domains[i]); }
      catch { out[domains[i]] = { title: '', description: '' }; }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return out;
}

async function aiRelevance(myDomain, myMeta, candidates, candidateMetas) {
  const orKey = process.env.OPENROUTER_API_KEY;
  if (!orKey || candidates.length === 0) return {};
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4.1-mini';
  const niche = [myMeta.title, myMeta.description].filter(Boolean).join(' — ') || myDomain;
  const lines = candidates.slice(0, 80).map((o, i) => {
    const meta = (candidateMetas && candidateMetas[o.domain]) || {};
    const snippet = [meta.title, meta.description].filter(Boolean).join(' — ').slice(0, 240);
    return `${i + 1}. ${o.domain} [heuristic: ${o.link_type}]` +
           (snippet ? `\n   Page says: "${snippet.replace(/"/g, "'")}"` : '\n   (no page content available)');
  }).join('\n');

  const prompt =
    'You are an SEO analyst doing topical relevance judgment for backlink opportunities.\n\n' +
    'MY WEBSITE\n' +
    'Domain: ' + myDomain + '\n' +
    'About: ' + niche + '\n\n' +
    'DEFINITION OF RELEVANCE\n' +
    'Relevance is about TOPIC OVERLAP — not authority, not popularity, not how many competitors link there.\n' +
    '  - High: The site\'s primary content is in the same vertical or a directly adjacent vertical that shares the same audience.\n' +
    '  - Medium: The site covers content that meaningfully overlaps but is broader.\n' +
    '  - Low: The site is in a different vertical. Competitors linking there does NOT make it relevant. Generic SEO blogs, marketing tool reviews, software aggregators, unrelated industry blogs, news sites without coverage of my niche — these are LOW even if many competitors link to them.\n' +
    'DEFAULT TO LOW. To upgrade to Medium or High you must point to specific topical content overlap visible in the "Page says" snippet.\n\n' +
    'SPAM JUDGMENT\n' +
    'Mark is_spam=true when: domain name looks random/generated, PBN-style naming on cheap TLDs, content-mill / pure-SEO-tool blogs, throwaway directories, the snippet is generic boilerplate or low-quality.\n\n' +
    'REFINED LINK TYPE\n' +
    'For each candidate, also return a refined link_type. Use the heuristic value if it is correct. Otherwise replace it with something more accurate based on the snippet — examples: "SEO Blog", "Marketing Blog", "Software Aggregator", "News Aggregator", "Job Board", "Crypto Blog", "Personal Blog", "Affiliate Site", "Lifestyle Blog", "Niche Authority", "Government", "Educational Institution". Do NOT use "Industry Blog" or "Other" — be specific.\n\n' +
    'CANDIDATES:\n' + lines + '\n\n' +
    'Respond ONLY with a JSON array (no markdown). Use the numbered index as id:\n' +
    '[{"id":1,"relevance":"Low","is_spam":false,"link_type":"SEO Blog","reason":"Generic SEO blog with no relevant content."}, ...]\n' +
    'Include every candidate, with id 1..' + candidates.slice(0, 80).length + '.';

  const data = await requestJson({
    method: 'POST',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    headers: {
      Authorization: 'Bearer ' + orKey,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://' + myDomain,
      'X-Title': 'Link Gap Relevance',
    },
    body: { model, messages: [{ role: 'user', content: prompt }], max_tokens: 4500, temperature: 0.15 },
    timeoutMs: 60000,
  });

  let content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content) return {};
  content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();
  let arr;
  try { arr = JSON.parse(content); } catch { return {}; }
  if (!Array.isArray(arr)) return {};
  const byDomain = {};
  for (const r of arr) {
    if (!r || typeof r.id !== 'number') continue;
    const src = candidates[r.id - 1];
    if (!src) continue;
    byDomain[src.domain] = {
      relevance: r.relevance || 'Unknown',
      is_spam_ai: !!r.is_spam,
      link_type: (r.link_type && typeof r.link_type === 'string') ? r.link_type.slice(0, 60) : null,
      reason: (r.reason || '').slice(0, 240),
    };
  }
  return byDomain;
}

// Apply spam + AI to an opps array in place, returns it.
async function enrichOpportunities(opps, myDomain) {
  const pbnFlagged = detectPbnClusters(opps.map((o) => o.domain));
  for (const o of opps) {
    const s = computeSpam(o, pbnFlagged);
    o.spam_score = s.spam_score;
    o.spam_signals = s.spam_signals;
  }
  const aiCandidates = opps
    .filter((o) => o.spam_score < 60)
    .slice()
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 80);
  const myMeta = await fetchMeta('https://' + myDomain);
  const candidateMetas = await fetchMetaBatch(aiCandidates.map((o) => o.domain), 10);
  const aiMap = await aiRelevance(myDomain, myMeta, aiCandidates, candidateMetas);
  for (const o of opps) {
    const r = aiMap[o.domain];
    if (r) {
      o.ai_relevance = r.relevance;
      o.ai_relevance_reason = r.reason;
      if (r.link_type) o.ai_link_type = r.link_type;
      if (r.is_spam_ai) {
        o.spam_score = Math.min(100, o.spam_score + 15);
        o.spam_signals.push('AI flagged as spam');
      }
    }
    o.is_spam = o.spam_score >= 50;
  }
  return opps;
}

// Paginated full-coverage fetch — for the user's own domain we want as
// complete a set as we can get so the missing-vs-shared diff is accurate.
// Caps at maxTotal (default 3000 = 3 API calls of 1000) so a huge site
// doesn't run away.
async function fetchAllReferringDomains(target, maxTotal = 3000) {
  const pageSize = 1000;
  let all = [];
  let offset = 0;
  while (all.length < maxTotal) {
    const batch = await fetchReferringDomains(target, pageSize, offset);
    if (!batch.length) break;
    all = all.concat(batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }
  return all.slice(0, maxTotal);
}

async function fetchSummary(target) {
  const raw = await dfsPost('/backlinks/summary/live', [
    { target, include_subdomains: true },
  ]);
  const t0 = raw && raw.tasks && raw.tasks[0];
  if (!(t0 && t0.status_code === 20000 && t0.result && t0.result[0])) {
    return { rank: 0, referring_domains: 0, backlinks: 0, spam_score: 0, ok: false };
  }
  const r = t0.result[0];
  return {
    rank: r.rank !== undefined ? Math.round(r.rank / 10) : 0,
    referring_domains: r.referring_domains || 0,
    backlinks: r.backlinks || 0,
    spam_score: (r.info && r.info.target_spam_score) || 0,
    ok: true,
  };
}

async function fetchAnchors(target) {
  const raw = await dfsPost('/backlinks/anchors/live', [
    { target, limit: 50, include_subdomains: true, order_by: ['backlinks,desc'] },
  ]);
  const items =
    (raw && raw.tasks && raw.tasks[0] && raw.tasks[0].result &&
      raw.tasks[0].result[0] && raw.tasks[0].result[0].items) || [];
  return items.map((it) => ({
    anchor: it.anchor || '',
    backlinks: it.backlinks || 0,
    referring_domains: it.referring_domains || 0,
  }));
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

// priority: how strongly the data argues for chasing this domain.
//   ↑ for higher frequency across competitors, higher DR, presence of strong
//   sources (EDU/GOV/News).
// difficulty: how hard the domain is likely to be to win a link from.
//   ↑ for high DR (gatekeeping), low DR communities are easy.
// relevance: best-effort signal — for now derived from frequency (multi-comp
//   links are inherently relevant to the niche).

function score(opportunity, competitorCount) {
  const freq = opportunity.competitor_count || 1;
  const dr = opportunity.rank || 0;
  const type = opportunity.link_type;

  const freqShare = competitorCount ? freq / competitorCount : 0;
  const priority = Math.round(
    Math.min(100,
      freqShare * 50 +
      Math.min(dr, 90) * 0.4 +
      (type === 'EDU' || type === 'GOV' ? 10 : 0) +
      (type === 'Editorial' ? 6 : 0)
    )
  );

  const difficulty = Math.round(
    Math.min(100,
      Math.max(5, dr * 0.85) +
      (type === 'EDU' || type === 'GOV' ? 10 : 0) +
      (type === 'Editorial' ? 8 : 0) -
      (type === 'Community' || type === 'Forum' || type === 'Web 2.0' ? 25 : 0)
    )
  );

  const relevance = freqShare >= 0.6 ? 'High' : freqShare >= 0.3 ? 'Medium' : 'Low';

  return { priority, difficulty, relevance };
}

// ─── Pool building ────────────────────────────────────────────────────────────
//
// Given an array of { source, rdList } records, build a union pool keyed by
// referring domain. Each pool entry tracks which sources link to it (so we
// can compute "shared across N competitors").

function buildPool(sources) {
  const pool = new Map();
  for (const s of sources) {
    for (const rd of s.rdList) {
      const key = rd.domain;
      if (!key) continue;
      const cur = pool.get(key) || {
        domain: key,
        rank: 0,
        backlinks: 0,
        referring_pages: 0,
        first_seen: rd.first_seen,
        sample_url: rd.sample_url,
        sources: new Set(),
      };
      cur.sources.add(s.label);
      cur.rank = Math.max(cur.rank, rd.rank || 0);
      cur.backlinks = Math.max(cur.backlinks, rd.backlinks || 0);
      cur.referring_pages = Math.max(cur.referring_pages, rd.referring_pages || 0);
      if (!cur.sample_url && rd.sample_url) cur.sample_url = rd.sample_url;
      pool.set(key, cur);
    }
  }
  return Array.from(pool.values()).map((p) => ({
    ...p,
    sources: Array.from(p.sources),
    competitor_count: p.sources.length,
  }));
}

function distributionByType(opps) {
  const dist = {};
  for (const o of opps) {
    // Prefer AI-refined type over heuristic when available
    const t = o.ai_link_type || o.link_type;
    dist[t] = (dist[t] || 0) + 1;
  }
  return Object.entries(dist)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

// ─── AI strategy layer (optional) ─────────────────────────────────────────────

async function aiStrategy({ mode, myDomain, summary, topMissing, distribution, authority }) {
  const orKey = process.env.OPENROUTER_API_KEY;
  if (!orKey) return null;
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4.1-mini';

  const topList = topMissing
    .slice(0, 15)
    .map((o) => `- ${o.domain} (DR ${o.rank}, type: ${o.link_type}, shared by ${o.competitor_count} competitor${o.competitor_count > 1 ? 's' : ''})`)
    .join('\n');

  const distList = distribution
    .slice(0, 10)
    .map((d) => `${d.type}: ${d.count}`)
    .join(', ');

  const authList = Object.entries(authority || {})
    .map(([d, s]) => `${d}: DR ${s.rank}, ${fmtNum(s.referring_domains)} RD, ${fmtNum(s.backlinks)} BL, spam ${s.spam_score}`)
    .join('\n');

  const prompt =
    'You are an SEO strategist. Given a link-gap analysis, produce concrete, actionable insights.\n\n' +
    'MODE: ' + (mode === 'serp' ? 'SERP gap (comparing top-ranking pages for a keyword)' : 'Competitor gap (root-domain comparison)') + '\n' +
    'MY DOMAIN: ' + myDomain + '\n\n' +
    'SUMMARY\n' + JSON.stringify(summary) + '\n\n' +
    'AUTHORITY SNAPSHOT\n' + authList + '\n\n' +
    'LINK TYPE DISTRIBUTION (across missing opportunities)\n' + distList + '\n\n' +
    'TOP 15 MISSING OPPORTUNITIES\n' + topList + '\n\n' +
    'Respond ONLY with valid JSON (no markdown):\n' +
    '{\n' +
    '  "headline": "One sentence diagnosing the biggest gap.",\n' +
    '  "why_competitors_outrank": "2-3 sentences. From the backlink perspective only.",\n' +
    '  "gap_dimensions": {\n' +
    '    "authority": "high|medium|low — and a sentence",\n' +
    '    "relevance": "high|medium|low — and a sentence",\n' +
    '    "diversity": "high|medium|low — and a sentence",\n' +
    '    "anchor_profile": "high|medium|low — and a sentence",\n' +
    '    "referring_domains": "high|medium|low — and a sentence",\n' +
    '    "link_velocity": "high|medium|low — and a sentence"\n' +
    '  },\n' +
    '  "underrepresented_categories": ["category 1", "category 2"],\n' +
    '  "recommended_tactics": ["3-5 concrete tactics ordered by impact"],\n' +
    '  "quick_wins": ["3-5 specific domains/pages to pitch first, with 1-line reasoning each"]\n' +
    '}';

  const data = await requestJson({
    method: 'POST',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    headers: {
      Authorization: 'Bearer ' + orKey,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://' + myDomain,
      'X-Title': 'Link Gap Analyser',
    },
    body: {
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 900,
      temperature: 0.3,
    },
    timeoutMs: 60000,
  });

  let content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content) return null;
  content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// ─── Mode 1: SERP gap ─────────────────────────────────────────────────────────

async function runSerpGap(input) {
  const myDomain = normalizeDomain(input.myDomain || '');
  if (!myDomain) throw new Error('myDomain is required.');
  const keyword = (input.keyword || '').trim();
  if (!keyword) throw new Error('keyword is required.');
  const locationCode = Number(input.locationCode || input.location_code || 2840);
  const languageCode = input.languageCode || input.language_code || 'en';
  const device = input.device || 'desktop';
  const perPageLimit = Math.min(200, Number(input.perPageLimit || 100));

  // Two-phase flow: preview SERP first, then analyse the user-picked subset.
  let serp;
  if (Array.isArray(input.selectedPages) && input.selectedPages.length > 0) {
    serp = input.selectedPages.map((p) => ({
      rank: p.rank,
      url: p.url,
      domain: normalizeDomain(p.domain || p.url),
      title: p.title || '',
      description: p.description || '',
    })).filter((p) => p.url);
    if (serp.length === 0) {
      return { success: false, error: 'selectedPages provided but contained no valid URLs.' };
    }
  } else {
    const preview = await fetchSerpResults(keyword, locationCode, languageCode, device, 20);
    if (preview.length === 0) {
      return { success: false, error: 'No SERP results returned. Check the keyword and location.' };
    }
    return {
      success: true,
      mode: 'serp',
      phase: 'preview',
      keyword,
      location_code: locationCode,
      language_code: languageCode,
      device,
      serp: preview,
    };
  }

  // 2. Referring domains per ranking URL (page-level — matches the page-level
  //    competition the SERP exposes) + my own root domain for comparison.
  const sources = [];
  const errors = [];

  // My domain — use root, since I likely don't rank for the keyword.
  // Paginate so the diff is accurate (the limit-300 single call was missing
  // links for sites with >300 referring domains).
  const myRd = await fetchAllReferringDomains(myDomain, 3000);
  const mineSet = new Set(myRd.map((r) => r.domain));

  for (const page of serp) {
    try {
      const rdList = await fetchReferringDomains(page.url, perPageLimit);
      sources.push({ label: page.domain + ' (rank ' + page.rank + ')', url: page.url, rdList });
    } catch (e) {
      errors.push({ url: page.url, message: String(e && e.message || e) });
    }
  }

  // 3. Pool + diff
  const pool = buildPool(sources);
  const missing = pool.filter((p) => !mineSet.has(p.domain));
  const shared  = pool.filter((p) => mineSet.has(p.domain));

  // 4. Classify + score
  const competitorCount = sources.length;
  const oppsRaw = missing.map((p) => ({
    ...p,
    link_type: classifyLink(p.domain, p.sample_url),
  }));
  const opps = oppsRaw.map((o) => ({ ...o, ...score(o, competitorCount) }));
  await enrichOpportunities(opps, myDomain);
  opps.sort((a, b) => b.priority - a.priority);

  // 5. Authority snapshot — my domain + each ranking domain (unique)
  const authority = {};
  authority[myDomain] = await fetchSummary(myDomain);
  const uniqueRankingDomains = Array.from(new Set(serp.map((s) => s.domain))).slice(0, 6);
  for (const d of uniqueRankingDomains) {
    authority[d] = await fetchSummary(d);
  }

  // 6. Anchor distribution for my domain (so the UI can flag anchor-profile gaps)
  const myAnchors = await fetchAnchors(myDomain);

  const distribution = distributionByType(opps);

  const summary = {
    mode: 'serp',
    keyword,
    location_code: locationCode,
    language_code: languageCode,
    device,
    serp_pages: serp.length,
    pool_size: pool.length,
    missing_count: missing.length,
    shared_count: shared.length,
    my_referring_domains: myRd.length,
    high_priority_count: opps.filter((o) => o.competitor_count >= 3).length,
  };

  const insights = await aiStrategy({
    mode: 'serp', myDomain, summary,
    topMissing: opps, distribution, authority,
  });

  return {
    success: true,
    mode: 'serp',
    summary,
    serp,
    authority,
    my_anchors: myAnchors,
    opportunities: opps,
    shared,
    type_distribution: distribution,
    insights,
    errors,
  };
}

// ─── Mode 2: Competitor gap ───────────────────────────────────────────────────

async function runCompetitorGap(input) {
  const myDomain = normalizeDomain(input.myDomain || '');
  if (!myDomain) throw new Error('myDomain is required.');
  const competitors = (input.competitors || []).map(normalizeDomain).filter(Boolean).slice(0, 5);
  if (competitors.length === 0) throw new Error('At least one competitor domain is required.');
  const limit = Math.min(500, Number(input.perDomainLimit || 250));

  // 1. Referring domains for me (full coverage) + each competitor (capped per `limit`)
  const myRd = await fetchAllReferringDomains(myDomain, 3000);
  const mineSet = new Set(myRd.map((r) => r.domain));

  const sources = [];
  const errors = [];
  for (const c of competitors) {
    try {
      const rdList = await fetchReferringDomains(c, limit);
      sources.push({ label: c, url: c, rdList });
    } catch (e) {
      errors.push({ competitor: c, message: String(e && e.message || e) });
    }
  }

  // 2. Pool + diff
  const pool = buildPool(sources);
  const missing = pool.filter((p) => !mineSet.has(p.domain));
  const shared  = pool.filter((p) => mineSet.has(p.domain));

  // 3. Classify + score
  const competitorCount = sources.length;
  const oppsRaw = missing.map((p) => ({
    ...p,
    link_type: classifyLink(p.domain, p.sample_url),
  }));
  const opps = oppsRaw.map((o) => ({ ...o, ...score(o, competitorCount) }));
  await enrichOpportunities(opps, myDomain);
  opps.sort((a, b) => b.priority - a.priority);

  // 4. Authority snapshot (mine + all competitors)
  const authority = {};
  authority[myDomain] = await fetchSummary(myDomain);
  for (const c of competitors) {
    authority[c] = await fetchSummary(c);
  }

  // 5. Anchors for my domain (for anchor-profile gap commentary)
  const myAnchors = await fetchAnchors(myDomain);

  const distribution = distributionByType(opps);

  const summary = {
    mode: 'competitor',
    competitors,
    pool_size: pool.length,
    missing_count: missing.length,
    shared_count: shared.length,
    my_referring_domains: myRd.length,
    multi_competitor_count: opps.filter((o) => o.competitor_count >= 2).length,
  };

  const insights = await aiStrategy({
    mode: 'competitor', myDomain, summary,
    topMissing: opps, distribution, authority,
  });

  return {
    success: true,
    mode: 'competitor',
    summary,
    competitors,
    authority,
    my_anchors: myAnchors,
    opportunities: opps,
    shared,
    type_distribution: distribution,
    insights,
    errors,
  };
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function handle(req, res) {
  try {
    const rawInput = req.body || {};
    const input = (rawInput.body && typeof rawInput.body === 'object') ? rawInput.body : rawInput;
    const mode = (input.mode || '').toLowerCase();

    if (mode === 'serp') {
      const result = await runSerpGap(input);
      return res.json(result);
    }
    if (mode === 'competitor' || mode === 'competitors') {
      const result = await runCompetitorGap(input);
      return res.json(result);
    }
    return res.json({
      success: false,
      error: 'mode must be "serp" or "competitor".',
      debug_received: rawInput,
    });
  } catch (topErr) {
    return res.json({
      success: false,
      error: String(topErr && topErr.message || topErr),
      stack: topErr && topErr.stack ? topErr.stack.slice(0, 800) : '',
    });
  }
}

module.exports = { handle };

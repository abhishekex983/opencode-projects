// ── Utilities ────────────────────────────────────────────────────────────────
function normalizeDomain(raw) {
  if (!raw) return '';
  var s = String(raw).trim().toLowerCase();
  s = s.replace(/^https?:\/\//, '').replace(/^www\./, '');
  return s.split('/')[0].split('?')[0].split('#')[0];
}
function fmtNum(n) {
  if (!n || n === 0) return '0';
  if (n >= 1000000) return (n/1000000).toFixed(1)+'M';
  if (n >= 1000)    return (n/1000).toFixed(1)+'K';
  return String(Math.round(n));
}

// ── Link-type classifier ─────────────────────────────────────────────────────
var TYPE_PATTERNS = [
  { type: 'EDU',               re: /\.edu(\.[a-z]{2,3})?$/ },
  { type: 'GOV',               re: /\.gov(\.[a-z]{2,3})?$/ },
  { type: 'SaaS/Tool Listing', re: /^(g2|capterra|getapp|trustradius|softwareadvice|saashub|producthunt|alternativeto|saaslist|saasworthy|crozdesk|sourceforge|slant)\./ },
  { type: 'PR',                re: /^(prnewswire|prweb|businesswire|globenewswire|prlog|einpresswire|openpr|24-7pressrelease|releasewire|pressreleasepoint)\./ },
  { type: 'Web 2.0',           re: /(medium|blogger|wordpress|wix|weebly|tumblr|substack|ghost|squarespace|jimdo|webnode)\.com$/ },
  { type: 'Community',         re: /(reddit|quora|stackexchange|stackoverflow|hackernews|news\.ycombinator|indiehackers|dev\.to|hashnode|discord|slack)/ },
  { type: 'Forum',             re: /(forum|community|board|discuss|talk\.|forums\.)/ },
  { type: 'Local Citation',    re: /(yelp|yellowpages|bbb\.org|foursquare|tripadvisor|justdial|sulekha|manta|citysearch|merchantcircle)/ },
  { type: 'Directory',         re: /(directory|listings?|dir\.|catalog|hub\.)/ },
  { type: 'Editorial',         re: /(news|times|post|herald|chronicle|tribune|gazette|magazine|today|wired|forbes|techcrunch|cnn|bbc|reuters|bloomberg)/ }
];
function classifyLink(refDomain, sampleUrl) {
  var d = (refDomain || '').toLowerCase();
  if (!d) return 'Industry Blog';
  for (var i = 0; i < TYPE_PATTERNS.length; i++) {
    if (TYPE_PATTERNS[i].re.test(d)) return TYPE_PATTERNS[i].type;
  }
  if (sampleUrl) {
    var u = sampleUrl.toLowerCase();
    if (/\/(resources?|links?|useful|tools|recommend|partners?)\//.test(u)) return 'Resource Page';
    if (/\/(guest-post|guest-author|contribut|by\/|author\/)/.test(u)) return 'Guest Post';
  }
  return 'Other';
}

// ── DataforSEO ───────────────────────────────────────────────────────────────
var API_BASE = 'https://api.dataforseo.com/v3';
var API_KEY  = Buffer.from('abhishekbolarshetty@gmail.com:6aa69ca0a4bf8188').toString('base64');
var AUTH_HDR = 'Basic ' + API_KEY;

async function dfsPost(endpoint, body) {
  try {
    var result = await this.helpers.httpRequest({
      method: 'POST',
      url: API_BASE + endpoint,
      headers: { 'Authorization': AUTH_HDR, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      returnFullResponse: false,
      ignoreHttpStatusErrors: true
    });
    return typeof result === 'string' ? JSON.parse(result) : result;
  } catch (e) {
    return { _error: e.message, tasks: [] };
  }
}

async function fetchSerpResults(keyword, locationCode, languageCode, device, maxResults) {
  var raw = await dfsPost.call(this, '/serp/google/organic/live/advanced', [{
    keyword: keyword,
    location_code: locationCode,
    language_code: languageCode || 'en',
    device: device || 'desktop',
    depth: 20
  }]);
  var task = raw && raw.tasks && raw.tasks[0];
  var r0   = task && task.result && task.result[0];
  var items = (r0 && r0.items) || [];
  return items
    .filter(function(it){ return it.type === 'organic' && it.url; })
    .slice(0, maxResults || 20)
    .map(function(it){
      return {
        rank: it.rank_absolute || it.rank_group,
        url: it.url,
        domain: normalizeDomain(it.domain || it.url),
        title: it.title || '',
        description: (it.description || '').slice(0, 200)
      };
    });
}

async function fetchReferringDomains(target, limit, offset) {
  var raw = await dfsPost.call(this, '/backlinks/referring_domains/live', [{
    target: target,
    limit: limit || 200,
    offset: offset || 0,
    mode: 'as_is',
    order_by: ['rank,desc'],
    include_subdomains: true
  }]);
  var task = raw && raw.tasks && raw.tasks[0];
  var r0   = task && task.result && task.result[0];
  var items = (r0 && r0.items) || [];
  return items.map(function(it){
    return {
      domain: normalizeDomain(it.domain || ''),
      rank: it.rank !== undefined ? Math.round(it.rank / 10) : 0,
      backlinks: it.backlinks || 0,
      referring_pages: it.referring_pages || 0,
      first_seen: it.first_seen || '',
      lost_date: it.lost_date || null,
      is_lost: !!it.lost_date,
      sample_url: it.url_from || '',
      // DataforSEO's per-domain spam score for backlinks coming from this
      // referring domain (0-100). Used as the base of our composite spam_score.
      dfs_spam_score: (typeof it.backlinks_spam_score === 'number') ? it.backlinks_spam_score : null
    };
  }).filter(function(x){ return x.domain; });
}

// ── Spam detection: TLD list + PBN-cluster + composite score ────────────────
//
// Combines three signals into a 0-100 composite:
//   1. DataforSEO's own backlinks_spam_score (base)
//   2. Suspicious TLD penalty (+20 for known PBN/cheap TLDs)
//   3. PBN-cluster penalty (+30 if 5+ result-set domains share a prefix/suffix)

var SUSPICIOUS_TLDS = ['xyz','top','click','space','website','site','online','info','tk','ml','ga','cf','gq','work','live','men','party','date','review','stream','download','science','racing','win','loan','cricket','accountant','faith','trade','bid','press'];

function tldOf(d) {
  if (!d) return '';
  var parts = d.split('.');
  if (parts.length < 2) return '';
  // Handle simple second-level domains (.co.uk style) by taking last two parts
  return parts[parts.length - 1].toLowerCase();
}

// Detect PBN clusters: ≥5 domains in the pool sharing a long common prefix
// (e.g. seo-anomaly-jakarta.space, seo-anomaly-beijing.website, ...). Returns
// a Set of domain → cluster_key.
function detectPbnClusters(domains) {
  var clusterOf = {};
  var prefixCounts = {};
  // Bucket by the first chunk before a digit, hyphen-segment, or TLD
  for (var i = 0; i < domains.length; i++) {
    var d = domains[i];
    var name = d.split('.')[0]; // strip TLD
    // Heuristic: take prefix up to last hyphen-separator if name has 2+ hyphens
    var parts = name.split('-');
    if (parts.length >= 2) {
      // try the first 2 hyphen segments as the cluster signature
      var key2 = parts[0] + '-' + parts[1];
      if (key2.length >= 6) {
        prefixCounts[key2] = (prefixCounts[key2] || 0) + 1;
        clusterOf[d] = key2;
        continue;
      }
    }
    // Otherwise use first 8 chars of name (catches numeric-suffix patterns)
    var key1 = name.slice(0, 8);
    if (key1.length >= 6) {
      prefixCounts[key1] = (prefixCounts[key1] || 0) + 1;
      clusterOf[d] = key1;
    }
  }
  // Keep only clusters with ≥5 members
  var validClusters = {};
  Object.keys(prefixCounts).forEach(function(k){
    if (prefixCounts[k] >= 5) validClusters[k] = prefixCounts[k];
  });
  var flagged = {};
  Object.keys(clusterOf).forEach(function(d){
    var k = clusterOf[d];
    if (validClusters[k]) flagged[d] = { cluster_key: k, cluster_size: validClusters[k] };
  });
  return flagged;
}

// Composite spam scoring + signal labels per opportunity.
function computeSpam(opp, pbnFlagged) {
  var signals = [];
  var score = 0;
  if (typeof opp.dfs_spam_score === 'number' && opp.dfs_spam_score >= 0) {
    score += opp.dfs_spam_score;
    if (opp.dfs_spam_score >= 30) signals.push('DataforSEO spam ' + opp.dfs_spam_score + '/100');
  }
  var tld = tldOf(opp.domain);
  if (tld && SUSPICIOUS_TLDS.indexOf(tld) !== -1) {
    score += 20;
    signals.push('.' + tld + ' TLD');
  }
  var pbn = pbnFlagged[opp.domain];
  if (pbn) {
    score += 30;
    signals.push('PBN cluster (' + pbn.cluster_size + ' similar domains)');
  }
  // AI flag layered later (after relevance call) — caller may bump score +15
  return { spam_score: Math.min(100, Math.round(score)), spam_signals: signals };
}

// ── Lightweight meta fetch (for niche inference) ────────────────────────────
async function fetchMeta(url) {
  try {
    var res = await this.helpers.httpRequest({
      method: 'GET',
      url: url,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)' },
      returnFullResponse: false,
      ignoreHttpStatusErrors: true,
      timeout: 8000
    });
    var html = typeof res === 'string' ? res : (res && typeof res.body === 'string' ? res.body : '');
    var tm = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
    var title = tm ? tm[1].trim() : '';
    var mm = html.match(/name=["']description["'][^>]*content=["']([^"']{1,400})["']/i)
          || html.match(/content=["']([^"']{1,400})["'][^>]*name=["']description["']/i)
          || html.match(/property=["']og:description["'][^>]*content=["']([^"']{1,400})["']/i);
    var desc = mm ? mm[1].trim() : '';
    return { title: title, description: desc };
  } catch (e) { return { title: '', description: '' }; }
}

// Parallel meta-fetch for a list of domains, with a small concurrency cap.
// Returns { domain → { title, description } }. Failed fetches yield empty strings.
async function fetchMetaBatch(domains, concurrency) {
  var helpers = this.helpers;
  var c = Math.max(1, concurrency || 8);
  var out = {};
  var idx = 0;
  async function worker() {
    while (true) {
      var i = idx++;
      if (i >= domains.length) return;
      var d = domains[i];
      try {
        var meta = await fetchMeta.call({ helpers: helpers }, 'https://' + d);
        out[d] = meta;
      } catch (_) { out[d] = { title: '', description: '' }; }
    }
  }
  var workers = [];
  for (var k = 0; k < c; k++) workers.push(worker());
  await Promise.all(workers);
  return out;
}

// ── AI batched relevance + spam classification ──────────────────────────────
// Sends a compact prompt with the user's niche + a list of candidate domains,
// returns an array of {domain, relevance, is_spam, reason}. One LLM call.
async function aiRelevance(myDomain, myMeta, candidates, candidateMetas, helpers) {
  if (!candidates.length) return {};
  var niche = [myMeta.title, myMeta.description].filter(Boolean).join(' — ') || myDomain;

  var lines = candidates.slice(0, 80).map(function(o, i){
    var meta = (candidateMetas && candidateMetas[o.domain]) || {};
    var snippet = [meta.title, meta.description].filter(Boolean).join(' — ').slice(0, 240);
    return (i + 1) + '. ' + o.domain + ' [heuristic: ' + o.link_type + ']' +
           (snippet ? '\n   Page says: "' + snippet.replace(/"/g, "'") + '"' : '\n   (no page content available)');
  }).join('\n');

  var prompt =
    'You are an SEO analyst doing topical relevance judgment for backlink opportunities.\n\n' +
    'MY WEBSITE\n' +
    'Domain: ' + myDomain + '\n' +
    'About: ' + niche + '\n\n' +
    'DEFINITION OF RELEVANCE\n' +
    'Relevance is about TOPIC OVERLAP — not authority, not popularity, not how many competitors link there.\n' +
    '  - High: The site\'s primary content is in the same vertical or a directly adjacent vertical that shares the same audience. Example for a "first aid training in Calgary" site: another first-aid training provider, a Canadian healthcare directory, a workplace-safety blog, an EMS news site, a Red Cross page.\n' +
    '  - Medium: The site covers content that meaningfully overlaps but is broader (e.g. for first aid: a general parenting/safety blog, an HR-compliance publication, a workplace-wellness site).\n' +
    '  - Low: The site is in a different vertical. Just because competitors link there does NOT make it relevant. Generic SEO blogs, marketing tool reviews, software review aggregators, unrelated industry blogs, news sites without health coverage, lifestyle blogs unrelated to safety/health — these are LOW for a first-aid site even if they link to many of its competitors.\n' +
    'DEFAULT TO LOW. To upgrade to Medium or High you must be able to point to specific topical content overlap visible in the "Page says" snippet.\n\n' +
    'SPAM JUDGMENT\n' +
    'Mark is_spam=true when: domain name looks random/generated, PBN-style naming (city/keyword permutations on cheap TLDs), content-mill / pure-SEO-tool blogs, throwaway directories with no editorial standards, the snippet is generic boilerplate or visibly low-quality.\n\n' +
    'REFINED LINK TYPE\n' +
    'For each candidate, also return a refined link_type. Use the heuristic value if it is correct. Otherwise replace it with something more accurate based on the snippet — examples: "SEO Blog", "Marketing Blog", "Software Aggregator", "News Aggregator", "Job Board", "Crypto Blog", "Personal Blog", "Affiliate Site", "Lifestyle Blog", "Niche Authority", "Government", "Educational Institution". Do NOT use "Industry Blog" or "Other" — be specific.\n\n' +
    'CANDIDATES:\n' + lines + '\n\n' +
    'Respond ONLY with a JSON array (no markdown). Use the numbered index as id:\n' +
    '[{"id":1,"relevance":"Low","is_spam":false,"link_type":"SEO Blog","reason":"Generic SEO/marketing blog with no first-aid content."}, ...]\n' +
    'Include every candidate, with id 1..' + candidates.slice(0, 80).length + '.';

  try {
    var res = await helpers.httpRequest({
      method: 'POST',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        'Authorization': 'Bearer ' + OR_KEY,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://' + myDomain,
        'X-Title': 'Link Gap Relevance'
      },
      body: JSON.stringify({
        model: OR_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4500,
        temperature: 0.15
      }),
      returnFullResponse: false,
      ignoreHttpStatusErrors: true
    });
    var data = typeof res === 'string' ? JSON.parse(res) : res;
    var content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) return {};
    content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();
    var arr = JSON.parse(content);
    if (!Array.isArray(arr)) return {};
    var byDomain = {};
    for (var i = 0; i < arr.length; i++) {
      var r = arr[i];
      if (!r || typeof r.id !== 'number') continue;
      var src = candidates[r.id - 1];
      if (!src) continue;
      byDomain[src.domain] = {
        relevance: r.relevance || 'Unknown',
        is_spam_ai: !!r.is_spam,
        link_type: (r.link_type && typeof r.link_type === 'string') ? r.link_type.slice(0, 60) : null,
        reason: (r.reason || '').slice(0, 240)
      };
    }
    return byDomain;
  } catch (e) { return {}; }
}

// Paginated full-coverage fetch — for the user's own domain we want as complete
// a set as we can get so the missing-vs-shared diff is accurate. Caps at maxTotal
// (default 3000 = 3 API calls of 1000) so a huge site doesn't run away.
async function fetchAllReferringDomains(target, maxTotal) {
  var cap = maxTotal || 3000;
  var pageSize = 1000;
  var all = [];
  var offset = 0;
  while (all.length < cap) {
    var batch = await fetchReferringDomains.call(this, target, pageSize, offset);
    if (!batch.length) break;
    all = all.concat(batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }
  return all.slice(0, cap);
}

async function fetchSummary(target) {
  var raw = await dfsPost.call(this, '/backlinks/summary/live', [{
    target: target, include_subdomains: true
  }]);
  var t0 = raw && raw.tasks && raw.tasks[0];
  if (!(t0 && t0.status_code === 20000 && t0.result && t0.result[0])) {
    return { rank: 0, referring_domains: 0, backlinks: 0, spam_score: 0, ok: false };
  }
  var r = t0.result[0];
  return {
    rank: r.rank !== undefined ? Math.round(r.rank / 10) : 0,
    referring_domains: r.referring_domains || 0,
    backlinks: r.backlinks || 0,
    spam_score: (r.info && r.info.target_spam_score) || 0,
    ok: true
  };
}

async function fetchAnchors(target) {
  var raw = await dfsPost.call(this, '/backlinks/anchors/live', [{
    target: target, limit: 50, include_subdomains: true, order_by: ['backlinks,desc']
  }]);
  var task = raw && raw.tasks && raw.tasks[0];
  var r0   = task && task.result && task.result[0];
  var items = (r0 && r0.items) || [];
  return items.map(function(it){
    return {
      anchor: it.anchor || '',
      backlinks: it.backlinks || 0,
      referring_domains: it.referring_domains || 0
    };
  });
}

// ── Scoring ──────────────────────────────────────────────────────────────────
function score(o, competitorCount) {
  var freq = o.competitor_count || 1;
  var dr   = o.rank || 0;
  var type = o.link_type;
  var freqShare = competitorCount ? freq / competitorCount : 0;
  var priority = Math.round(Math.min(100,
    freqShare * 50 +
    Math.min(dr, 90) * 0.4 +
    ((type === 'EDU' || type === 'GOV') ? 10 : 0) +
    (type === 'Editorial' ? 6 : 0)
  ));
  var difficulty = Math.round(Math.min(100,
    Math.max(5, dr * 0.85) +
    ((type === 'EDU' || type === 'GOV') ? 10 : 0) +
    (type === 'Editorial' ? 8 : 0) -
    ((type === 'Community' || type === 'Forum' || type === 'Web 2.0') ? 25 : 0)
  ));
  var relevance = freqShare >= 0.6 ? 'High' : freqShare >= 0.3 ? 'Medium' : 'Low';
  return { priority: priority, difficulty: difficulty, relevance: relevance };
}

function buildPool(sources) {
  var pool = {};
  for (var i = 0; i < sources.length; i++) {
    var s = sources[i];
    for (var j = 0; j < s.rdList.length; j++) {
      var rd = s.rdList[j];
      var key = rd.domain;
      if (!key) continue;
      var cur = pool[key] || {
        domain: key, rank: 0, backlinks: 0, referring_pages: 0,
        first_seen: rd.first_seen, sample_url: rd.sample_url,
        sources: {}
      };
      cur.sources[s.label] = true;
      cur.rank = Math.max(cur.rank, rd.rank || 0);
      cur.backlinks = Math.max(cur.backlinks, rd.backlinks || 0);
      cur.referring_pages = Math.max(cur.referring_pages, rd.referring_pages || 0);
      if (!cur.sample_url && rd.sample_url) cur.sample_url = rd.sample_url;
      pool[key] = cur;
    }
  }
  return Object.keys(pool).map(function(k){
    var p = pool[k];
    var srcs = Object.keys(p.sources);
    return {
      domain: p.domain, rank: p.rank, backlinks: p.backlinks,
      referring_pages: p.referring_pages, first_seen: p.first_seen,
      sample_url: p.sample_url, sources: srcs, competitor_count: srcs.length
    };
  });
}

function distributionByType(opps) {
  var dist = {};
  for (var i = 0; i < opps.length; i++) {
    // Prefer AI-refined type over heuristic when available
    var t = opps[i].ai_link_type || opps[i].link_type;
    dist[t] = (dist[t] || 0) + 1;
  }
  return Object.keys(dist).map(function(t){ return { type: t, count: dist[t] }; })
    .sort(function(a, b){ return b.count - a.count; });
}

// ── AI strategy layer ────────────────────────────────────────────────────────
var OR_KEY   = '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';
var OR_MODEL = 'openai/gpt-4.1-mini';

async function aiStrategy(args) {
  var mode = args.mode, myDomain = args.myDomain;
  var summary = args.summary, topMissing = args.topMissing;
  var distribution = args.distribution, authority = args.authority, helpers = args.helpers;

  var topList = topMissing.slice(0, 15).map(function(o){
    return '- ' + o.domain + ' (DR ' + o.rank + ', type: ' + o.link_type + ', shared by ' + o.competitor_count + ' competitor' + (o.competitor_count > 1 ? 's' : '') + ')';
  }).join('\n');

  var distList = distribution.slice(0, 10).map(function(d){
    return d.type + ': ' + d.count;
  }).join(', ');

  var authList = Object.keys(authority || {}).map(function(d){
    var s = authority[d];
    return d + ': DR ' + s.rank + ', ' + fmtNum(s.referring_domains) + ' RD, ' + fmtNum(s.backlinks) + ' BL, spam ' + s.spam_score;
  }).join('\n');

  var prompt =
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

  try {
    var res = await helpers.httpRequest({
      method: 'POST',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        'Authorization': 'Bearer ' + OR_KEY,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://' + myDomain,
        'X-Title': 'Link Gap Analyser'
      },
      body: JSON.stringify({
        model: OR_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 900,
        temperature: 0.3
      }),
      returnFullResponse: false,
      ignoreHttpStatusErrors: true
    });
    var data = typeof res === 'string' ? JSON.parse(res) : res;
    var content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) return null;
    content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(content);
  } catch (e) { return null; }
}

// ── Top-level try/catch ensures Respond node always gets valid JSON ─────────
try {

var rawInput = $input.first().json;
var input = (rawInput.body && typeof rawInput.body === 'object') ? rawInput.body : rawInput;

// Ping for "Test" button
if (input.ping === true || input.mode === '__ping__') {
  return [{ json: { success: true, ping: 'ok', service: 'link-gap' } }];
}

var mode = (input.mode || '').toLowerCase();

// ── Mode 1: SERP gap ─────────────────────────────────────────────────────
if (mode === 'serp') {
  var myDomain = normalizeDomain(input.myDomain || '');
  if (!myDomain) return [{ json: { success: false, error: 'myDomain is required.' } }];
  var keyword = (input.keyword || '').trim();
  if (!keyword) return [{ json: { success: false, error: 'keyword is required.' } }];
  var locationCode = Number(input.locationCode || input.location_code || 2840);
  var languageCode = input.languageCode || input.language_code || 'en';
  var device = input.device || 'desktop';
  var perPageLimit = Math.min(200, Number(input.perPageLimit || 100));

  // Two-phase flow:
  //   - Phase 1 (no selectedPages in input) → fetch 20 SERP results and return them
  //     for the user to pick from. No further work, no backlink calls yet.
  //   - Phase 2 (selectedPages provided) → skip SERP API call entirely and use the
  //     user's picked subset directly.
  var serp;
  if (Array.isArray(input.selectedPages) && input.selectedPages.length > 0) {
    // Trust the frontend-cached SERP metadata for the chosen subset
    serp = input.selectedPages.map(function(p){
      return {
        rank: p.rank,
        url: p.url,
        domain: normalizeDomain(p.domain || p.url),
        title: p.title || '',
        description: p.description || ''
      };
    }).filter(function(p){ return p.url; });
    if (serp.length === 0) {
      return [{ json: { success: false, error: 'selectedPages provided but contained no valid URLs.' } }];
    }
  } else {
    var preview = await fetchSerpResults.call(this, keyword, locationCode, languageCode, device, 20);
    if (preview.length === 0) {
      return [{ json: { success: false, error: 'No SERP results returned. Check the keyword and location.' } }];
    }
    // Return preview only — frontend will let user pick, then call back with selectedPages
    return [{ json: {
      success: true,
      mode: 'serp',
      phase: 'preview',
      keyword: keyword,
      location_code: locationCode,
      language_code: languageCode,
      device: device,
      serp: preview
    } }];
  }

  var sources = [];
  var errors = [];
  var myRd = await fetchAllReferringDomains.call(this, myDomain, 3000);
  var mineSet = {};
  for (var mi = 0; mi < myRd.length; mi++) mineSet[myRd[mi].domain] = true;

  for (var si = 0; si < serp.length; si++) {
    var page = serp[si];
    try {
      var rdList = await fetchReferringDomains.call(this, page.url, perPageLimit);
      sources.push({ label: page.domain + ' (rank ' + page.rank + ')', url: page.url, rdList: rdList });
    } catch (e) {
      errors.push({ url: page.url, message: String(e && e.message || e) });
    }
  }

  var pool = buildPool(sources);
  var missing = pool.filter(function(p){ return !mineSet[p.domain]; });
  var shared  = pool.filter(function(p){ return mineSet[p.domain]; });

  var competitorCount = sources.length;
  var opps = missing.map(function(p){
    var withType = Object.assign({}, p, { link_type: classifyLink(p.domain, p.sample_url) });
    var scores = score(withType, competitorCount);
    return Object.assign(withType, scores);
  });

  // ── Spam scoring: PBN clusters within result set + TLD + DataforSEO score
  var allDomains = opps.map(function(o){ return o.domain; });
  var pbnFlagged = detectPbnClusters(allDomains);
  for (var sp = 0; sp < opps.length; sp++) {
    var spamOut = computeSpam(opps[sp], pbnFlagged);
    opps[sp].spam_score = spamOut.spam_score;
    opps[sp].spam_signals = spamOut.spam_signals;
  }

  // ── AI relevance pass — only top 80 by priority, post-rough-spam-filter
  //    (skip obvious junk so we don't waste tokens on it)
  var aiCandidates = opps
    .slice() // copy
    .filter(function(o){ return o.spam_score < 60; })
    .sort(function(a, b){ return b.priority - a.priority; })
    .slice(0, 80);

  var myMeta = await fetchMeta.call(this, 'https://' + myDomain);
  // Pre-fetch candidate domain meta in parallel so the AI judges from real text
  var candidateMetas = await fetchMetaBatch.call(this, aiCandidates.map(function(o){ return o.domain; }), 10);
  var aiMap = await aiRelevance(myDomain, myMeta, aiCandidates, candidateMetas, this.helpers);

  // Merge AI judgments back in, bump spam score if AI flagged spam,
  // record the AI-refined link_type for display.
  for (var ai2 = 0; ai2 < opps.length; ai2++) {
    var aiRow = aiMap[opps[ai2].domain];
    if (aiRow) {
      opps[ai2].ai_relevance = aiRow.relevance;
      opps[ai2].ai_relevance_reason = aiRow.reason;
      if (aiRow.link_type) opps[ai2].ai_link_type = aiRow.link_type;
      if (aiRow.is_spam_ai) {
        opps[ai2].spam_score = Math.min(100, opps[ai2].spam_score + 15);
        opps[ai2].spam_signals.push('AI flagged as spam');
      }
    }
    opps[ai2].is_spam = opps[ai2].spam_score >= 50;
  }

  // Final sort by priority (after AI signal merged)
  opps.sort(function(a, b){ return b.priority - a.priority; });

  var authority = {};
  authority[myDomain] = await fetchSummary.call(this, myDomain);
  var uniqueDomains = {};
  for (var ud = 0; ud < serp.length; ud++) uniqueDomains[serp[ud].domain] = true;
  var udKeys = Object.keys(uniqueDomains).slice(0, 6);
  for (var udi = 0; udi < udKeys.length; udi++) {
    authority[udKeys[udi]] = await fetchSummary.call(this, udKeys[udi]);
  }

  var myAnchors = await fetchAnchors.call(this, myDomain);
  var distribution = distributionByType(opps);

  var summary = {
    mode: 'serp',
    keyword: keyword,
    location_code: locationCode,
    language_code: languageCode,
    device: device,
    serp_pages: serp.length,
    pool_size: pool.length,
    missing_count: missing.length,
    shared_count: shared.length,
    my_referring_domains: myRd.length,
    high_priority_count: opps.filter(function(o){ return o.competitor_count >= 3; }).length
  };

  var insights = await aiStrategy({
    mode: 'serp', myDomain: myDomain, summary: summary,
    topMissing: opps, distribution: distribution, authority: authority,
    helpers: this.helpers
  });

  return [{ json: {
    success: true, mode: 'serp', summary: summary, serp: serp,
    authority: authority, my_anchors: myAnchors, opportunities: opps,
    shared: shared, type_distribution: distribution, insights: insights, errors: errors
  } }];
}

// ── Mode 2: Competitor gap ───────────────────────────────────────────────
if (mode === 'competitor' || mode === 'competitors') {
  var myDomain2 = normalizeDomain(input.myDomain || '');
  if (!myDomain2) return [{ json: { success: false, error: 'myDomain is required.' } }];
  var competitors = (input.competitors || []).map(normalizeDomain).filter(Boolean).slice(0, 5);
  if (competitors.length === 0) return [{ json: { success: false, error: 'At least one competitor domain is required.' } }];
  var limit = Math.min(500, Number(input.perDomainLimit || 250));

  var myRd2 = await fetchAllReferringDomains.call(this, myDomain2, 3000);
  var mineSet2 = {};
  for (var mi2 = 0; mi2 < myRd2.length; mi2++) mineSet2[myRd2[mi2].domain] = true;

  var sources2 = [];
  var errors2 = [];
  for (var ci2 = 0; ci2 < competitors.length; ci2++) {
    var c = competitors[ci2];
    try {
      var rdList2 = await fetchReferringDomains.call(this, c, limit);
      sources2.push({ label: c, url: c, rdList: rdList2 });
    } catch (e) {
      errors2.push({ competitor: c, message: String(e && e.message || e) });
    }
  }

  var pool2 = buildPool(sources2);
  var missing2 = pool2.filter(function(p){ return !mineSet2[p.domain]; });
  var shared2  = pool2.filter(function(p){ return mineSet2[p.domain]; });

  var competitorCount2 = sources2.length;
  var opps2 = missing2.map(function(p){
    var withType = Object.assign({}, p, { link_type: classifyLink(p.domain, p.sample_url) });
    var scores = score(withType, competitorCount2);
    return Object.assign(withType, scores);
  });

  // Spam scoring (same as serp mode)
  var allDomains2 = opps2.map(function(o){ return o.domain; });
  var pbnFlagged2 = detectPbnClusters(allDomains2);
  for (var sp2 = 0; sp2 < opps2.length; sp2++) {
    var spamOut2 = computeSpam(opps2[sp2], pbnFlagged2);
    opps2[sp2].spam_score = spamOut2.spam_score;
    opps2[sp2].spam_signals = spamOut2.spam_signals;
  }

  // AI relevance
  var aiCandidates2 = opps2
    .slice()
    .filter(function(o){ return o.spam_score < 60; })
    .sort(function(a, b){ return b.priority - a.priority; })
    .slice(0, 80);
  var myMeta2 = await fetchMeta.call(this, 'https://' + myDomain2);
  var candidateMetas2 = await fetchMetaBatch.call(this, aiCandidates2.map(function(o){ return o.domain; }), 10);
  var aiMap2 = await aiRelevance(myDomain2, myMeta2, aiCandidates2, candidateMetas2, this.helpers);
  for (var aix = 0; aix < opps2.length; aix++) {
    var aiRow2 = aiMap2[opps2[aix].domain];
    if (aiRow2) {
      opps2[aix].ai_relevance = aiRow2.relevance;
      opps2[aix].ai_relevance_reason = aiRow2.reason;
      if (aiRow2.link_type) opps2[aix].ai_link_type = aiRow2.link_type;
      if (aiRow2.is_spam_ai) {
        opps2[aix].spam_score = Math.min(100, opps2[aix].spam_score + 15);
        opps2[aix].spam_signals.push('AI flagged as spam');
      }
    }
    opps2[aix].is_spam = opps2[aix].spam_score >= 50;
  }

  opps2.sort(function(a, b){ return b.priority - a.priority; });

  var authority2 = {};
  authority2[myDomain2] = await fetchSummary.call(this, myDomain2);
  for (var ai = 0; ai < competitors.length; ai++) {
    authority2[competitors[ai]] = await fetchSummary.call(this, competitors[ai]);
  }

  var myAnchors2 = await fetchAnchors.call(this, myDomain2);
  var distribution2 = distributionByType(opps2);

  var summary2 = {
    mode: 'competitor',
    competitors: competitors,
    pool_size: pool2.length,
    missing_count: missing2.length,
    shared_count: shared2.length,
    my_referring_domains: myRd2.length,
    multi_competitor_count: opps2.filter(function(o){ return o.competitor_count >= 2; }).length
  };

  var insights2 = await aiStrategy({
    mode: 'competitor', myDomain: myDomain2, summary: summary2,
    topMissing: opps2, distribution: distribution2, authority: authority2,
    helpers: this.helpers
  });

  return [{ json: {
    success: true, mode: 'competitor', summary: summary2, competitors: competitors,
    authority: authority2, my_anchors: myAnchors2, opportunities: opps2,
    shared: shared2, type_distribution: distribution2, insights: insights2, errors: errors2
  } }];
}

return [{ json: {
  success: false,
  error: 'mode must be "serp" or "competitor".',
  debug_received: rawInput
} }];

} catch (topErr) {
  return [{ json: {
    success: false,
    error: String(topErr && topErr.message || topErr),
    stack: topErr && topErr.stack ? topErr.stack.slice(0, 800) : ''
  } }];
}

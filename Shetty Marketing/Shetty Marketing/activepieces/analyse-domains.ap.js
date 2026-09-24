export const code = async (inputs) => {
  // ── Utilities ────────────────────────────────────────────────────────────────
  function normalizeDomain(raw) {
    if (!raw) return '';
    var s = raw.trim().toLowerCase();
    s = s.replace(/^https?:\/\//, '').replace(/^www\./, '');
    return s.split('/')[0].split('?')[0].split('#')[0];
  }
  function fmtNum(n) {
    if (!n || n === 0) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
    return String(Math.round(n));
  }

  // ── Lightweight page meta fetch (title + description only) ───────────────────
  async function fetchMeta(url) {
    try {
      var res  = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)' }
      });
      var html = await res.text();
      var tm   = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
      var title = tm ? tm[1].trim() : '';
      var mm   = html.match(/name=["']description["'][^>]*content=["']([^"']{1,400})["']/i)
             || html.match(/content=["']([^"']{1,400})["'][^>]*name=["']description["']/i)
             || html.match(/property=["']og:description["'][^>]*content=["']([^"']{1,400})["']/i)
             || html.match(/content=["']([^"']{1,400})["'][^>]*property=["']og:description["']/i);
      var desc = mm ? mm[1].trim() : '';
      return { title: title, description: desc, ok: !!(title || desc) };
    } catch (e) { return { title: '', description: '', ok: false }; }
  }

  // ── OpenRouter AI call ────────────────────────────────────────────────────────
  var OR_KEY   = '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';
  var OR_MODEL = 'openai/gpt-4.1-mini';

  async function aiAssess(myDomain, myMeta, adjDomain, adjMeta, metrics) {
    var myDesc  = [myMeta.title,  myMeta.description ].filter(Boolean).join(' — ') || myDomain;
    var adjDesc = [adjMeta.title, adjMeta.description].filter(Boolean).join(' — ') || adjDomain;
    var prompt =
      'You are an SEO analyst evaluating backlink opportunities.\n\n' +
      'MY WEBSITE\n' +
      'Domain: ' + myDomain + '\n' +
      'About: ' + myDesc + '\n\n' +
      'SITE TO EVALUATE\n' +
      'Domain: ' + adjDomain + '\n' +
      'About: ' + adjDesc + '\n\n' +
      'DATAFORSEO METRICS\n' +
      '- Domain Rank: ' + metrics.rank + '/100\n' +
      '- Referring Domains: ' + fmtNum(metrics.referringDomains) + '\n' +
      '- Backlinks: ' + fmtNum(metrics.backlinks) + '\n' +
      '- Spam Score: ' + metrics.spamScore + '/100\n' +
      '- Est. Organic Traffic: ' + fmtNum(metrics.totalTraffic) + ' visits/mo\n\n' +
      'Respond ONLY with valid JSON (no markdown, no extra text):\n' +
      '{\n' +
      '  "site_summary": "One sentence: what is this site about?",\n' +
      '  "relevancy": "High" or "Medium" or "Low",\n' +
      '  "verdict": "Good" or "Conditional" or "Bad",\n' +
      '  "reason": "2-3 sentences explaining the domain quality and whether it is a good backlink opportunity for my site. Mention the site niche, traffic quality, and domain authority."\n' +
      '}';
    try {
      var res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + OR_KEY,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://' + myDomain,
          'X-Title': 'Domain Analyser'
        },
        body: JSON.stringify({
          model: OR_MODEL,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 250,
          temperature: 0.3
        })
      });
      var data    = await res.json();
      var content = data && data.choices && data.choices[0] &&
                    data.choices[0].message && data.choices[0].message.content;
      if (!content) return null;
      // Strip markdown code fences if present
      content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();
      return JSON.parse(content);
    } catch (e) { return null; }
  }

  // ── DataforSEO ───────────────────────────────────────────────────────────────
  var API_BASE = 'https://api.dataforseo.com/v3';
  var AUTH_HDR = 'Basic __APIKEY_B64__';

  async function dfsPost(endpoint, body) {
    try {
      var res = await fetch(API_BASE + endpoint, {
        method:  'POST',
        headers: { 'Authorization': AUTH_HDR, 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
      });
      return await res.json();
    } catch (e) {
      return { _error: e.message, tasks: [] };
    }
  }

  // ── Normalise historical-traffic response into [{month:'YYYY-MM', etv:n}] ────
  function extractHistory(rawResp) {
    var out = [];
    try {
      var task  = rawResp && rawResp.tasks && rawResp.tasks[0];
      var r0    = task && task.result && task.result[0];
      var items = (r0 && r0.items) || [];
      if (items.length > 0 && items[0].year !== undefined) {
        // Shape A — one item per month
        out = items.map(function (m) {
          var mm  = String(m.month).padStart(2, '0');
          var etv = m && m.metrics && m.metrics.organic && m.metrics.organic.etv;
          return { month: m.year + '-' + mm, etv: Number(etv) || 0 };
        });
      } else if (items.length > 0 && items[0].metrics && items[0].metrics.organic) {
        // Shape B — single item with etv_history map
        var eh = items[0].metrics.organic.etv_history;
        if (eh && typeof eh === 'object') {
          out = Object.keys(eh).map(function (k) {
            return { month: k, etv: Number(eh[k]) || 0 };
          });
        }
      }
    } catch (e) {}
    return out
      .filter(function (p) { return /^\d{4}-\d{2}$/.test(p.month); })
      .sort(function (a, b) { return a.month.localeCompare(b.month); })
      .slice(-12);
  }

  // ── Fallback verdict (when AI is unavailable) ────────────────────────────────
  function fallbackVerdict(r) {
    var rank = r.rank || 0, rd = r.referringDomains || 0, ss = r.spamScore || 0;
    var tot = Object.values(r.traffic).reduce(function (a, b) { return a + b; }, 0);
    if (ss > 50) return { verdict: 'Bad', relevancy: 'Low',
      reason: 'High spam score (' + ss + '/100) disqualifies this domain.' };
    var tS  = tot >= 100000 ? 3 : tot >= 20000 ? 2.5 : tot >= 5000 ? 2 : tot >= 500 ? 1.5 : 1;
    var rkS = rank >= 60 ? 3 : rank >= 40 ? 2.5 : rank >= 20 ? 2 : rank >= 10 ? 1.5 : 1;
    var rfS = rd >= 1000 ? 3 : rd >= 200 ? 2.5 : rd >= 50 ? 2 : rd >= 10 ? 1.5 : 1;
    var spS = ss <= 5 ? 3 : ss <= 15 ? 2.5 : ss <= 30 ? 2 : ss <= 45 ? 1.5 : 1;
    var w   = tS * 0.35 + rkS * 0.30 + rfS * 0.20 + spS * 0.15;
    var v   = w >= 2.2 ? 'Good' : w >= 1.65 ? 'Conditional' : 'Bad';
    return { verdict: v, relevancy: 'Unknown',
      reason: 'Domain rank: ' + rank + '/100, ' + fmtNum(rd) + ' referring domains, ' + fmtNum(tot) + ' est. visits/mo, spam score: ' + ss + '/100.' };
  }

  // ── Top-level try/catch ensures the Return Response node always gets valid JSON ─
  try {

    // This step uses fetch(), available only when Activepieces runs Code in a Node
    // runtime: AP_EXECUTION_MODE = UNSANDBOXED (self-hosted default) or SANDBOX_PROCESS.
    // Activepieces Cloud uses SANDBOX_CODE_ONLY (a V8 isolate with no fetch / no require).
    if (typeof fetch !== 'function') {
      return { success: false,
        error: 'fetch is unavailable in this execution mode. Run a self-hosted Activepieces with AP_EXECUTION_MODE=UNSANDBOXED (default) or SANDBOX_PROCESS. Activepieces Cloud (SANDBOX_CODE_ONLY) cannot make HTTP calls from a Code step.' };
    }

    // Activepieces passes the webhook POST body in as inputs.body (mapped from {{trigger.body}}).
    var input     = (inputs && inputs.body && typeof inputs.body === 'object') ? inputs.body : (inputs || {});
    var myDomain  = normalizeDomain(input.myDomain || '');
    var domains   = (input.domains || []).map(normalizeDomain).filter(Boolean);
    var countries = input.countries || [{ code: 2840, lang: 'en', name: 'United States' }];

    if (!myDomain || domains.length === 0) {
      return { success: false,
        error: 'myDomain and at least one domain are required.',
        debug_received: input };
    }

    var primaryCountry = countries[0];

    // Step 1: get my site's meta description for AI context
    var myMeta = await fetchMeta('https://' + myDomain);

    // Step 2: DataforSEO competitor map (works for established sites)
    var competitorMap = {};
    var compData  = await dfsPost(
      '/dataforseo_labs/google/competitors_domain/live',
      [{ target: myDomain, location_code: primaryCountry.code,
         language_code: primaryCountry.lang || 'en', limit: 200 }]
    );
    var compTask  = compData.tasks && compData.tasks[0];
    var compItems = (compTask && compTask.result && compTask.result[0] && compTask.result[0].items) || [];
    compItems.forEach(function (ci) {
      competitorMap[normalizeDomain(ci.domain)] = ci.intersections || 0;
    });
    var hasComp = compItems.length > 0;

    // Step 3: analyse each adjacent domain
    var results = [];
    for (var di = 0; di < domains.length; di++) {
      var domain = domains[di];
      var item = {
        domain: domain, rank: 0, referringDomains: 0,
        backlinks: 0, spamScore: 0, traffic: {}, trafficHistory: {},
        relLabel: 'Unknown', siteSummary: '',
        errors: [], hasBacklinkData: false
      };

      // 3a: fetch adjacent site meta
      var adjMeta = await fetchMeta('https://' + domain);

      // 3b: backlinks summary
      var blRaw  = await dfsPost('/backlinks/summary/live',
        [{ target: domain, include_subdomains: true }]);
      var blTask = blRaw.tasks && blRaw.tasks[0];
      if (blTask && blTask.status_code === 20000 && blTask.result && blTask.result[0]) {
        var bl = blTask.result[0];
        item.rank             = bl.rank             !== undefined ? Math.round(bl.rank / 10) : 0;
        item.referringDomains = bl.referring_domains !== undefined ? bl.referring_domains    : 0;
        item.backlinks        = bl.backlinks         !== undefined ? bl.backlinks             : 0;
        item.spamScore        = (bl.info && bl.info.target_spam_score !== undefined)
                                 ? bl.info.target_spam_score : 0;
        item.hasBacklinkData  = true;
      } else {
        var blErr = blRaw._error || (blTask && blTask.status_message) || 'backlinks unavailable';
        item.errors.push({ api: 'backlinks', message: blErr });
      }

      // 3c: organic traffic — one request per country for reliable ordering
      for (var ci = 0; ci < countries.length; ci++) {
        var ctry = countries[ci];
        var tRaw = await dfsPost(
          '/dataforseo_labs/google/domain_rank_overview/live',
          [{ target: domain, location_code: ctry.code, language_code: ctry.lang || 'en' }]
        );
        var tTask = tRaw.tasks && tRaw.tasks[0];
        var r0    = tTask && tTask.result && tTask.result[0];
        var it0   = r0 && r0.items && r0.items[0];
        var org   = it0 && it0.metrics && it0.metrics.organic;
        item.traffic[String(ctry.code)] = org ? (org.etv || 0) : 0;

        // 3c-2: 12-month historical traffic for the same country
        var hRaw = await dfsPost(
          '/dataforseo_labs/google/historical_rank_overview/live',
          [{ target: domain, location_code: ctry.code, language_code: ctry.lang || 'en' }]
        );
        var history = extractHistory(hRaw);
        if (history.length === 0) {
          // Fallback: try the bulk endpoint, which uses a different response shape
          var hRaw2 = await dfsPost(
            '/dataforseo_labs/google/historical_bulk_traffic_estimation/live',
            [{ targets: [domain], location_code: ctry.code, language_code: ctry.lang || 'en' }]
          );
          history = extractHistory(hRaw2);
        }
        if (history.length === 0 && (hRaw._error || hRaw.tasks && hRaw.tasks[0] && hRaw.tasks[0].status_code !== 20000)) {
          var hErr = hRaw._error || (hRaw.tasks[0] && hRaw.tasks[0].status_message) || 'history unavailable';
          item.errors.push({ api: 'historical_rank_overview', country: ctry.code, message: hErr });
        }
        item.trafficHistory[String(ctry.code)] = history;
      }

      // 3d: AI assessment via OpenRouter
      var totalTraffic = Object.values(item.traffic).reduce(function (a, b) { return a + b; }, 0);
      var aiResult = await aiAssess(myDomain, myMeta, domain, adjMeta, {
        rank: item.rank, referringDomains: item.referringDomains,
        backlinks: item.backlinks, spamScore: item.spamScore,
        totalTraffic: totalTraffic
      });

      if (aiResult && aiResult.verdict && aiResult.relevancy && aiResult.reason) {
        item.siteSummary = aiResult.site_summary || '';
        item.verdict = {
          verdict:  aiResult.verdict,
          relLabel: aiResult.relevancy,
          reason:   (aiResult.site_summary ? aiResult.site_summary + ' ' : '') + aiResult.reason
        };
      } else {
        // Fallback if AI call fails
        var fb = fallbackVerdict(item);
        item.verdict = { verdict: fb.verdict, relLabel: fb.relevancy, reason: fb.reason };
      }

      results.push(item);
    }

    return { success: true, results: results };

  } catch (topErr) {
    return { success: false, error: String(topErr),
      stack: topErr && topErr.stack ? topErr.stack.slice(0, 800) : '' };
  }
};

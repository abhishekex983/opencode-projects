const { dfsPost } = require('../util/dataforseo');
const { requestJson, requestText } = require('../util/http');
const { normalizeDomain, fmtNum } = require('../util/domain');

async function fetchMeta(url) {
  const html = await requestText({
    method: 'GET',
    url,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)' },
    timeoutMs: 12000,
  });
  if (!html) return { title: '', description: '', ok: false };
  const tm = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
  const title = tm ? tm[1].trim() : '';
  const mm =
    html.match(/name=["']description["'][^>]*content=["']([^"']{1,400})["']/i) ||
    html.match(/content=["']([^"']{1,400})["'][^>]*name=["']description["']/i) ||
    html.match(/property=["']og:description["'][^>]*content=["']([^"']{1,400})["']/i) ||
    html.match(/content=["']([^"']{1,400})["'][^>]*property=["']og:description["']/i);
  const description = mm ? mm[1].trim() : '';
  return { title, description, ok: !!(title || description) };
}

async function aiAssess(myDomain, myMeta, adjDomain, adjMeta, metrics) {
  const orKey = process.env.OPENROUTER_API_KEY;
  if (!orKey) return null;
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4.1-mini';

  const myDesc = [myMeta.title, myMeta.description].filter(Boolean).join(' — ') || myDomain;
  const adjDesc = [adjMeta.title, adjMeta.description].filter(Boolean).join(' — ') || adjDomain;
  const prompt =
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

  const data = await requestJson({
    method: 'POST',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    headers: {
      Authorization: 'Bearer ' + orKey,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://' + myDomain,
      'X-Title': 'Domain Analyser',
    },
    body: {
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 250,
      temperature: 0.3,
    },
    timeoutMs: 45000,
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

// Normalise historical-traffic response into [{month:'YYYY-MM', etv:n}].
// Handles both DataforSEO response shapes:
//   A) historical_rank_overview/live → items[i] = {year, month, metrics.organic.etv}
//   B) historical_bulk_traffic_estimation/live → items[0].metrics.organic.etv_history = {'YYYY-MM': etv}
function extractHistory(rawResp) {
  let out = [];
  try {
    const task = rawResp && rawResp.tasks && rawResp.tasks[0];
    const r0 = task && task.result && task.result[0];
    const items = (r0 && r0.items) || [];
    if (items.length > 0 && items[0].year !== undefined) {
      out = items.map((m) => {
        const mm = String(m.month).padStart(2, '0');
        const etv = m && m.metrics && m.metrics.organic && m.metrics.organic.etv;
        return { month: m.year + '-' + mm, etv: Number(etv) || 0 };
      });
    } else if (items.length > 0 && items[0].metrics && items[0].metrics.organic) {
      const eh = items[0].metrics.organic.etv_history;
      if (eh && typeof eh === 'object') {
        out = Object.keys(eh).map((k) => ({ month: k, etv: Number(eh[k]) || 0 }));
      }
    }
  } catch {}
  return out
    .filter((p) => /^\d{4}-\d{2}$/.test(p.month))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);
}

function fallbackVerdict(r) {
  const rank = r.rank || 0;
  const rd = r.referringDomains || 0;
  const ss = r.spamScore || 0;
  const tot = Object.values(r.traffic).reduce((a, b) => a + b, 0);
  if (ss > 50) {
    return {
      verdict: 'Bad',
      relevancy: 'Low',
      reason: 'High spam score (' + ss + '/100) disqualifies this domain.',
    };
  }
  const tS = tot >= 100000 ? 3 : tot >= 20000 ? 2.5 : tot >= 5000 ? 2 : tot >= 500 ? 1.5 : 1;
  const rkS = rank >= 60 ? 3 : rank >= 40 ? 2.5 : rank >= 20 ? 2 : rank >= 10 ? 1.5 : 1;
  const rfS = rd >= 1000 ? 3 : rd >= 200 ? 2.5 : rd >= 50 ? 2 : rd >= 10 ? 1.5 : 1;
  const spS = ss <= 5 ? 3 : ss <= 15 ? 2.5 : ss <= 30 ? 2 : ss <= 45 ? 1.5 : 1;
  const w = tS * 0.35 + rkS * 0.3 + rfS * 0.2 + spS * 0.15;
  const v = w >= 2.2 ? 'Good' : w >= 1.65 ? 'Conditional' : 'Bad';
  return {
    verdict: v,
    relevancy: 'Unknown',
    reason:
      'Domain rank: ' + rank + '/100, ' + fmtNum(rd) + ' referring domains, ' +
      fmtNum(tot) + ' est. visits/mo, spam score: ' + ss + '/100.',
  };
}

async function handle(req, res) {
  try {
    const rawInput = req.body || {};
    const input = (rawInput.body && typeof rawInput.body === 'object') ? rawInput.body : rawInput;
    const myDomain = normalizeDomain(input.myDomain || '');
    const domains = (input.domains || []).map(normalizeDomain).filter(Boolean);
    const countries = input.countries || [{ code: 2840, lang: 'en', name: 'United States' }];

    if (!myDomain || domains.length === 0) {
      return res.json({
        success: false,
        error: 'myDomain and at least one domain are required.',
        debug_received: rawInput,
      });
    }

    const primaryCountry = countries[0];
    const myMeta = await fetchMeta('https://' + myDomain);

    // Competitor map (best-effort; not used directly downstream but kept for parity)
    const competitorMap = {};
    const compData = await dfsPost('/dataforseo_labs/google/competitors_domain/live', [
      { target: myDomain, location_code: primaryCountry.code, language_code: primaryCountry.lang || 'en', limit: 200 },
    ]);
    const compItems =
      (compData && compData.tasks && compData.tasks[0] && compData.tasks[0].result &&
        compData.tasks[0].result[0] && compData.tasks[0].result[0].items) || [];
    compItems.forEach((ci) => {
      competitorMap[normalizeDomain(ci.domain)] = ci.intersections || 0;
    });

    const results = [];
    for (const domain of domains) {
      const item = {
        domain,
        rank: 0,
        referringDomains: 0,
        backlinks: 0,
        spamScore: 0,
        traffic: {},
        trafficHistory: {},
        relLabel: 'Unknown',
        siteSummary: '',
        errors: [],
        hasBacklinkData: false,
      };

      const adjMeta = await fetchMeta('https://' + domain);

      const blRaw = await dfsPost('/backlinks/summary/live', [
        { target: domain, include_subdomains: true },
      ]);
      const blTask = blRaw && blRaw.tasks && blRaw.tasks[0];
      if (blTask && blTask.status_code === 20000 && blTask.result && blTask.result[0]) {
        const bl = blTask.result[0];
        item.rank = bl.rank !== undefined ? Math.round(bl.rank / 10) : 0;
        item.referringDomains = bl.referring_domains !== undefined ? bl.referring_domains : 0;
        item.backlinks = bl.backlinks !== undefined ? bl.backlinks : 0;
        item.spamScore = bl.info && bl.info.target_spam_score !== undefined ? bl.info.target_spam_score : 0;
        item.hasBacklinkData = true;
      } else {
        const blErr = (blRaw && blRaw._error) || (blTask && blTask.status_message) || 'backlinks unavailable';
        item.errors.push({ api: 'backlinks', message: blErr });
      }

      for (const ctry of countries) {
        const tRaw = await dfsPost('/dataforseo_labs/google/domain_rank_overview/live', [
          { target: domain, location_code: ctry.code, language_code: ctry.lang || 'en' },
        ]);
        const it0 =
          tRaw && tRaw.tasks && tRaw.tasks[0] && tRaw.tasks[0].result &&
          tRaw.tasks[0].result[0] && tRaw.tasks[0].result[0].items && tRaw.tasks[0].result[0].items[0];
        const org = it0 && it0.metrics && it0.metrics.organic;
        item.traffic[String(ctry.code)] = org ? (org.etv || 0) : 0;

        let hRaw = await dfsPost('/dataforseo_labs/google/historical_rank_overview/live', [
          { target: domain, location_code: ctry.code, language_code: ctry.lang || 'en' },
        ]);
        let history = extractHistory(hRaw);
        if (history.length === 0) {
          const hRaw2 = await dfsPost('/dataforseo_labs/google/historical_bulk_traffic_estimation/live', [
            { targets: [domain], location_code: ctry.code, language_code: ctry.lang || 'en' },
          ]);
          history = extractHistory(hRaw2);
          if (history.length === 0) hRaw = hRaw2;
        }
        if (history.length === 0) {
          const hTask = hRaw && hRaw.tasks && hRaw.tasks[0];
          if ((hRaw && hRaw._error) || (hTask && hTask.status_code !== 20000)) {
            const hErr = (hRaw && hRaw._error) || (hTask && hTask.status_message) || 'history unavailable';
            item.errors.push({ api: 'historical_rank_overview', country: ctry.code, message: hErr });
          }
        }
        item.trafficHistory[String(ctry.code)] = history;
      }

      const totalTraffic = Object.values(item.traffic).reduce((a, b) => a + b, 0);
      const aiResult = await aiAssess(myDomain, myMeta, domain, adjMeta, {
        rank: item.rank,
        referringDomains: item.referringDomains,
        backlinks: item.backlinks,
        spamScore: item.spamScore,
        totalTraffic,
      });

      if (aiResult && aiResult.verdict && aiResult.relevancy && aiResult.reason) {
        item.siteSummary = aiResult.site_summary || '';
        item.verdict = {
          verdict: aiResult.verdict,
          relLabel: aiResult.relevancy,
          reason: (aiResult.site_summary ? aiResult.site_summary + ' ' : '') + aiResult.reason,
        };
      } else {
        const fb = fallbackVerdict(item);
        item.verdict = { verdict: fb.verdict, relLabel: fb.relevancy, reason: fb.reason };
      }

      results.push(item);
    }

    return res.json({ success: true, results });
  } catch (topErr) {
    return res.json({
      success: false,
      error: String(topErr),
      stack: topErr && topErr.stack ? topErr.stack.slice(0, 800) : '',
    });
  }
}

module.exports = { handle };

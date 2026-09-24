const { requestJson } = require('./http');

const BASE = 'https://app.neuronwriter.com/neuron-api/0.5/writer';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function headers(apiKey) {
  return {
    'X-API-KEY': apiKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

// Mirrors the n8n NeuronWriter Enrichment node:
//   - POST /new-query with project + keyword
//   - wait 45s, then poll /get-query up to 10× with 15s gaps
//   - returns the same { neuronwriter, neuronwriter_status, ... } shape
async function enrich({ apiKey, projectId, keyword, language = 'English' }) {
  if (!apiKey || !projectId) {
    return { neuronwriter: null, neuronwriter_status: 'disabled' };
  }

  const newQueryRes = await requestJson({
    method: 'POST',
    url: BASE + '/new-query',
    headers: headers(apiKey),
    body: { project: projectId, keyword, engine: 'google.com', language },
    timeoutMs: 30000,
  });

  if (newQueryRes._error) {
    return {
      neuronwriter: null,
      neuronwriter_status: 'error',
      neuronwriter_error: newQueryRes._error,
    };
  }

  const queryId = newQueryRes.query || newQueryRes.id || newQueryRes.query_id;
  if (!queryId) {
    return {
      neuronwriter: null,
      neuronwriter_status: 'error',
      neuronwriter_error: 'new-query did not return a query id',
      neuronwriter_raw: newQueryRes,
    };
  }

  await sleep(45000);

  let data = null;
  let lastStatus = null;
  for (let i = 0; i < 10; i++) {
    const resp = await requestJson({
      method: 'POST',
      url: BASE + '/get-query',
      headers: headers(apiKey),
      body: { query: queryId },
      timeoutMs: 30000,
    });
    lastStatus = resp.status;
    if (resp.status === 'ready') { data = resp; break; }
    if (resp.status === 'failed' || resp.status === 'error') {
      return {
        neuronwriter: null,
        neuronwriter_status: 'error',
        neuronwriter_error: resp.status,
        neuronwriter_raw: resp,
      };
    }
    await sleep(15000);
  }

  if (!data) {
    return {
      neuronwriter: null,
      neuronwriter_status: 'timeout',
      neuronwriter_query_id: queryId,
      neuronwriter_last_status: lastStatus,
    };
  }

  const terms = data.terms || {};
  const competitors = data.competitors || [];
  const termToStr = (t) => (typeof t === 'string' ? t : (t && (t.t || t.term || t.text) || ''));
  const getArr = (obj, ...keys) => {
    for (const k of keys) if (obj && Array.isArray(obj[k])) return obj[k];
    return [];
  };
  const clean = (arr) => arr.map(termToStr).filter(Boolean);
  const uniq = (arr) => [...new Set(arr)];

  const h1FromTerms = clean(getArr(terms, 'h1'));
  const h2FromTerms = clean(getArr(terms, 'h2'));
  const competitorHeadings = [];
  for (const c of competitors.slice(0, 10)) {
    const hs = c.headings || c.h || [];
    for (const h of hs) {
      const text = typeof h === 'string' ? h : (h && (h.text || h.t) || '');
      if (text) competitorHeadings.push(text);
    }
  }

  const basicTerms = clean(getArr(terms, 'content_basic', 'basic', 'b')).slice(0, 40);
  const extendedTerms = clean(getArr(terms, 'content_extended', 'extended', 'e')).slice(0, 30);
  const titleTerms = clean(getArr(terms, 'title', 't')).slice(0, 20);

  const entitiesRaw = data.entities || terms.entities || [];
  const entities = clean(Array.isArray(entitiesRaw) ? entitiesRaw : []).slice(0, 30);

  const questionsRaw = data.questions || terms.questions || data.suggested_queries || [];
  const articleQueries = clean(Array.isArray(questionsRaw) ? questionsRaw : []).slice(0, 20);

  return {
    neuronwriter: {
      query_id: queryId,
      headings: uniq([...h1FromTerms, ...h2FromTerms, ...competitorHeadings]).slice(0, 40),
      terms: { basic: basicTerms, extended: extendedTerms, title: titleTerms, h1: h1FromTerms },
      entities,
      article_queries: articleQueries,
      content_score_target: data.content_score_target || data.target_score || null,
    },
    neuronwriter_status: 'ready',
  };
}

module.exports = { enrich };

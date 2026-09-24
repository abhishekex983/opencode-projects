const { requestJson } = require('./http');

function nlpKey() {
  const k = process.env.GOOGLE_NLP_API_KEY;
  if (!k) throw new Error('GOOGLE_NLP_API_KEY missing from environment');
  return k;
}

// Google Cloud Natural Language v1 — analyzeEntities. V1 (not V2) because V2
// dropped salience scores. Content type is HTML or PLAIN_TEXT; HTML mode lets
// the service weight headings/links naturally.
async function analyzeEntities({ content, type = 'PLAIN_TEXT', language = 'en', timeoutMs = 30000 }) {
  return requestJson({
    method: 'POST',
    url: 'https://language.googleapis.com/v1/documents:analyzeEntities?key=' + nlpKey(),
    headers: { 'Content-Type': 'application/json' },
    body: {
      document: { type, language, content },
      encodingType: 'UTF8',
    },
    timeoutMs,
  });
}

// Backwards-compat wrapper used by salience-brief (always HTML).
async function analyzeEntitiesHtml({ html, language = 'en', timeoutMs = 30000 }) {
  return analyzeEntities({ content: html, type: 'HTML', language, timeoutMs });
}

module.exports = { analyzeEntities, analyzeEntitiesHtml };

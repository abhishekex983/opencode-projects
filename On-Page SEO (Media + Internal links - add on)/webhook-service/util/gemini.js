const { requestJson } = require('./http');

function geminiKey() {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error('GEMINI_API_KEY missing from environment');
  return k;
}

function model() {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

async function generateJson({ systemPrompt, userPrompt, temperature = 0.2, timeoutMs = 60000 }) {
  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/' +
    encodeURIComponent(model()) +
    ':generateContent?key=' +
    geminiKey();

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature,
      responseMimeType: 'application/json',
    },
  };

  return requestJson({
    method: 'POST',
    url,
    headers: { 'Content-Type': 'application/json' },
    body,
    timeoutMs,
  });
}

// Parse Gemini's `candidates[0].content.parts[0].text` into a JSON object.
// Falls back to stripping a ```json fence if the model misbehaves.
function parseGeminiJson(response) {
  const text = response && response.candidates && response.candidates[0]
    && response.candidates[0].content && response.candidates[0].content.parts
    && response.candidates[0].content.parts[0] && response.candidates[0].content.parts[0].text;

  if (!text) return { error: 'No text in Gemini response', raw: response };

  try {
    return { plan: JSON.parse(text) };
  } catch {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    try {
      return { plan: JSON.parse(cleaned) };
    } catch {
      return { error: 'Failed to parse JSON from Gemini', raw_text: text };
    }
  }
}

module.exports = { generateJson, parseGeminiJson };

const { requestJson } = require('./http');

function orKey() {
  const k = process.env.OPENROUTER_API_KEY;
  if (!k) throw new Error('OPENROUTER_API_KEY missing from environment');
  return k;
}

// Mirrors the OpenRouter Chat node from the n8n workflow.
// Returns the raw OpenRouter response (or { _error } from requestJson).
async function chat({ model, messages, temperature = 0.2, responseFormat = 'json_object', timeoutMs = 60000, referer, title }) {
  return requestJson({
    method: 'POST',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    headers: {
      Authorization: 'Bearer ' + orKey(),
      'Content-Type': 'application/json',
      'HTTP-Referer': referer || 'https://shettymarketing.local/on-page-seo',
      'X-Title': title || 'On-Page SEO',
    },
    body: {
      model,
      messages,
      temperature,
      response_format: responseFormat ? { type: responseFormat } : undefined,
    },
    timeoutMs,
  });
}

// Extract JSON from `choices[0].message.content`, stripping a stray ```json fence if needed.
function parseChatJson(response) {
  if (response && response._error) {
    return { error: 'OpenRouter request failed: ' + response._error, raw: response };
  }
  if (response && response.error) {
    const msg = response.error.message || response.error.code || JSON.stringify(response.error);
    return { error: 'OpenRouter error: ' + msg, raw: response.error };
  }
  const text = response && response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content;
  if (!text) {
    return { error: 'No content in OpenRouter response', raw: response };
  }
  try {
    return { json: JSON.parse(text) };
  } catch {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    try {
      return { json: JSON.parse(cleaned) };
    } catch {
      return { error: 'Failed to parse JSON from model', raw_text: text };
    }
  }
}

module.exports = { chat, parseChatJson };

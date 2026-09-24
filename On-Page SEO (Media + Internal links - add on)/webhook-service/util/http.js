// Minimal helpers around fetch so handler code reads like the original n8n
// Code-node calls (httpRequest with returnFullResponse / ignoreHttpStatusErrors).

async function requestJson({ method = 'POST', url, headers = {}, body, timeoutMs = 60000 }) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body == null ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)),
      signal: ctrl.signal,
    });
    const text = await res.text();
    if (!text) return { _status: res.status };
    try {
      return JSON.parse(text);
    } catch {
      return { _status: res.status, _raw: text };
    }
  } catch (e) {
    return { _error: String(e && e.message || e) };
  } finally {
    clearTimeout(t);
  }
}

async function requestText({ method = 'GET', url, headers = {}, timeoutMs = 15000 }) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method, headers, signal: ctrl.signal });
    return await res.text();
  } catch {
    return '';
  } finally {
    clearTimeout(t);
  }
}

module.exports = { requestJson, requestText };

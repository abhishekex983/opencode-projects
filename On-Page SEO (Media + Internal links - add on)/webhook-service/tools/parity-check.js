#!/usr/bin/env node
// Hit the live n8n entity-presence webhook and the new Node endpoint with the
// same payload, then print a structural diff. AI-generated text and timestamps
// vary per call and are stripped before diffing.
//
// Usage:
//   node tools/parity-check.js <n8nUrl> <nodeUrl>
//
// Example:
//   node tools/parity-check.js \
//     https://n8n.srv1195841.hstgr.cloud/webhook/ranking-report \
//     http://localhost:5679/webhook/entity-presence

const [, , n8nUrl, nodeUrl] = process.argv;

if (!n8nUrl || !nodeUrl) {
  console.error('Usage: node tools/parity-check.js <n8nUrl> <nodeUrl>');
  process.exit(2);
}

const payload = {
  search_term: 'pediatric dentist austin',
  location: 'Austin,Texas,United States',
  target_business_name: 'Sunshine Kids Dentistry',
  target_website: '',
  competitors: [],
  requested_at: new Date().toISOString(),
};

async function post(url) {
  const t0 = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { _raw: text }; }
  return { ms: Date.now() - t0, status: res.status, json };
}

// Strip fields that legitimately vary between calls.
// - `plan` is LLM output: wording, ordering, and array length all drift.
// - `generated_at` is a timestamp.
// - `competitor_enrichment.search_center.formatted` and `*.editorialSummary`
//   are stable across short windows but we don't want a flaky diff on them.
// - `target_gbp.userRatingCount` / `rating` / `photoCount` shift as live GBP data changes.
function stripVolatile(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const copy = JSON.parse(JSON.stringify(obj));
  delete copy.plan;
  delete copy.generated_at;
  delete copy.target_gbp;
  if (copy.competitor_enrichment) {
    delete copy.competitor_enrichment.competitors; // per-competitor live data drifts
    delete copy.competitor_enrichment.search_center;
  }
  if (copy.target_enrichment) {
    delete copy.target_enrichment.distance_from_search_center_km;
  }
  return copy;
}

function structuralKeys(o, prefix = '') {
  if (o == null || typeof o !== 'object') return [];
  if (Array.isArray(o)) return o.length ? structuralKeys(o[0], prefix + '[]') : [prefix + '[]'];
  const out = [];
  for (const k of Object.keys(o).sort()) {
    out.push(prefix ? prefix + '.' + k : k);
    out.push(...structuralKeys(o[k], prefix ? prefix + '.' + k : k));
  }
  return out;
}

(async () => {
  console.log('Payload:', JSON.stringify(payload, null, 2));

  console.log(`\nCalling n8n:  ${n8nUrl}`);
  const n8n = await post(n8nUrl);
  console.log(`  HTTP ${n8n.status} in ${n8n.ms}ms`);

  console.log(`Calling node: ${nodeUrl}`);
  const node = await post(nodeUrl);
  console.log(`  HTTP ${node.status} in ${node.ms}ms`);

  const a = stripVolatile(n8n.json);
  const b = stripVolatile(node.json);

  const ak = new Set(structuralKeys(a));
  const bk = new Set(structuralKeys(b));
  const onlyA = [...ak].filter((k) => !bk.has(k));
  const onlyB = [...bk].filter((k) => !ak.has(k));

  if (onlyA.length === 0 && onlyB.length === 0) {
    console.log('\nPARITY OK — top-level key shape matches (LLM / volatile fields ignored).');
    console.log('Plan presence: n8n=' + !!(n8n.json && n8n.json.plan) + ' node=' + !!(node.json && node.json.plan));
    return;
  }

  console.log('\nDRIFT detected.');
  if (onlyA.length) {
    console.log('Keys only in n8n response:');
    onlyA.forEach((k) => console.log('  - ' + k));
  }
  if (onlyB.length) {
    console.log('Keys only in node response:');
    onlyB.forEach((k) => console.log('  - ' + k));
  }
  process.exit(1);
})().catch((e) => {
  console.error('parity-check failed:', e);
  process.exit(1);
});

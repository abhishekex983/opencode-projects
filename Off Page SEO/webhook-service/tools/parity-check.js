#!/usr/bin/env node
// Hit the live n8n webhook and the new Node endpoint with the same payload,
// then print a diff of fields that should match. AI verdict text and timing
// fields are ignored — they vary by run.
//
// Usage:
//   node tools/parity-check.js <n8nUrl> <nodeUrl> [myDomain] [adjacentDomain]

const [, , n8nUrl, nodeUrl, myDomainArg, adjArg] = process.argv;

if (!n8nUrl || !nodeUrl) {
  console.error('Usage: node tools/parity-check.js <n8nUrl> <nodeUrl> [myDomain] [adjacent]');
  process.exit(2);
}

const myDomain = myDomainArg || 'shettymarketing.com';
const adjacent = adjArg || 'example.com';

const payload = {
  myDomain,
  domains: [adjacent],
  countries: [{ code: 2840, lang: 'en', name: 'United States' }],
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

// Strip fields that legitimately differ between calls.
function stripVolatile(item) {
  if (!item || typeof item !== 'object') return item;
  const copy = JSON.parse(JSON.stringify(item));
  if (copy.results) {
    copy.results = copy.results.map((r) => {
      delete r.siteSummary;
      if (r.verdict) {
        delete r.verdict.reason;
      }
      // history values from DataforSEO can shift slightly between runs
      delete r.trafficHistory;
      delete r.errors;
      return r;
    });
  }
  return copy;
}

function diff(a, b, path = '') {
  const out = [];
  if (typeof a !== typeof b) {
    out.push(`${path}: type mismatch (${typeof a} vs ${typeof b})`);
    return out;
  }
  if (a && typeof a === 'object') {
    const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
    for (const k of keys) {
      out.push(...diff(a?.[k], b?.[k], path ? `${path}.${k}` : k));
    }
    return out;
  }
  if (a !== b) out.push(`${path}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
  return out;
}

(async () => {
  console.log(`Payload: ${JSON.stringify(payload)}`);
  console.log(`\nCalling n8n:  ${n8nUrl}`);
  const n8n = await post(n8nUrl);
  console.log(`  HTTP ${n8n.status} in ${n8n.ms}ms`);

  console.log(`Calling node: ${nodeUrl}`);
  const node = await post(nodeUrl);
  console.log(`  HTTP ${node.status} in ${node.ms}ms`);

  const a = stripVolatile(n8n.json);
  const b = stripVolatile(node.json);
  const d = diff(a, b);
  if (d.length === 0) {
    console.log('\nPARITY OK — structural responses match (volatile fields ignored).');
  } else {
    console.log(`\nDRIFT in ${d.length} fields:`);
    for (const line of d.slice(0, 50)) console.log('  ' + line);
    if (d.length > 50) console.log(`  …and ${d.length - 50} more`);
    process.exit(1);
  }
})().catch((e) => {
  console.error('parity-check failed:', e);
  process.exit(1);
});

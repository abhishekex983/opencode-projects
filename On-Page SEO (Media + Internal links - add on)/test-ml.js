const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('media-library-manager-workflow.json', 'utf8'));
const codeNode = wf.nodes.find(n => n.name === 'Media Lib Logic');
const code = codeNode.parameters.jsCode;

// Simulate what n8n does
const body = {
  action: 'add_items',
  collection_id: 2,
  urls: [
    'https://example.com/test.png',
    { url: 'https://youtube.com/watch?v=abc123' }
  ]
};

// Test isValidUrl
function isValidUrl(str) {
  try { new URL(str); return true; } catch (e) { return false; }
}

console.log('Testing isValidUrl:');
console.log('  https://example.com/test.png:', isValidUrl('https://example.com/test.png'));
console.log('  https://youtube.com/watch?v=abc123:', isValidUrl('https://youtube.com/watch?v=abc123'));

// Simulate the add_items logic
const urls = body.urls;
console.log('\nURLs array type:', typeof urls, Array.isArray(urls));
console.log('URLs:', JSON.stringify(urls));

for (let i = 0; i < urls.length; i++) {
  const entry = urls[i];
  const url = (typeof entry === 'string') ? entry.trim() : (entry.url || '').trim();
  console.log(`Entry ${i}: type=${typeof entry}, url="${url}", valid=${isValidUrl(url)}`);
}

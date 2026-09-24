const { requestJson } = require('./http');

const API_BASE = 'https://api.dataforseo.com/v3';

function authHeader() {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    throw new Error('DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD missing from environment');
  }
  return 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');
}

async function dfsPost(endpoint, body) {
  return requestJson({
    method: 'POST',
    url: API_BASE + endpoint,
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body,
    timeoutMs: 90000,
  });
}

module.exports = { dfsPost };

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { makeTestApp } = require('./helpers');
const { loadConfig } = require('../src/config/env');

test('CORS allows the allow-list and same-origin requests, not other sites', async () => {
  const { request } = makeTestApp();
  const listed = await request().get('/api/health').set('Origin', 'http://localhost:5173');
  assert.equal(listed.headers['access-control-allow-origin'], 'http://localhost:5173');

  const same = await request().get('/api/health').set('Host', 'mindmate.vercel.app').set('Origin', 'https://mindmate.vercel.app');
  assert.equal(same.headers['access-control-allow-origin'], 'https://mindmate.vercel.app');

  const other = await request().get('/api/health').set('Host', 'mindmate.vercel.app').set('Origin', 'https://evil.example');
  assert.equal(other.headers['access-control-allow-origin'], undefined);
});

test('proxy is trusted automatically on Vercel', () => {
  assert.equal(loadConfig({ NODE_ENV: 'test', DATA_STORE: 'memory' }).trustProxy, false);
  assert.equal(loadConfig({ NODE_ENV: 'test', DATA_STORE: 'memory', VERCEL: '1' }).trustProxy, true);
});

test('Vercel function explains a missing configuration instead of crashing', async () => {
  const entry = path.resolve(__dirname, '../../api/index.js');
  const saved = { ...process.env };
  try {
    // Production without Firebase credentials is invalid.
    for (const k of Object.keys(process.env)) if (/^(FIREBASE|FIRESTORE|GOOGLE_APP|GEMINI|OPENAI|AI_|DATA_STORE)/.test(k)) delete process.env[k];
    process.env.NODE_ENV = 'production';
    delete require.cache[entry];
    const handler = require(entry);
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b; } };
    handler({}, res);
    assert.equal(res.statusCode, 503);
    const body = JSON.parse(res.body);
    assert.equal(body.error.code, 'SERVER_NOT_CONFIGURED');
    assert.match(body.error.message, /DATA_STORE=firestore/);
  } finally {
    process.env = saved;
    delete require.cache[entry];
  }
});

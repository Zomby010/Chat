'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createAIProvider } = require('../src/services/ai');
const { guardOutput, SAFE_REPLACEMENT } = require('../src/services/ai/outputGuard');
const { buildSystemPrompt } = require('../src/services/ai/prompt');

const base = { timeoutMs: 1000, maxOutputTokens: 100 };
const jsonRes = (status, body) => ({ ok: status < 400, status, json: async () => body });

test('gemini provider sends system instruction and maps roles', async () => {
  let sent;
  const fetchImpl = async (url, init) => {
    sent = { url, init, body: JSON.parse(init.body) };
    return jsonRes(200, { candidates: [{ content: { parts: [{ text: 'Hello there' }] } }] });
  };
  const ai = createAIProvider({ ...base, provider: 'gemini', gemini: { apiKey: 'k', model: 'gemini-x', baseUrl: 'https://g.example' } }, { fetchImpl });
  const out = await ai.generate({ system: 'SYS', messages: [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'yo' }] });
  assert.equal(out.text, 'Hello there');
  assert.equal(sent.url, 'https://g.example/v1beta/models/gemini-x:generateContent');
  assert.equal(sent.init.headers['x-goog-api-key'], 'k');
  assert.equal(sent.body.systemInstruction.parts[0].text, 'SYS');
  assert.deepEqual(sent.body.contents.map((c) => c.role), ['user', 'model']);
});

test('openai provider prepends system message', async () => {
  let body;
  const fetchImpl = async (_url, init) => {
    body = JSON.parse(init.body);
    return jsonRes(200, { choices: [{ message: { content: 'Hi!' } }] });
  };
  const ai = createAIProvider({ ...base, provider: 'openai', openai: { apiKey: 'k', model: 'm', baseUrl: 'https://o.example' } }, { fetchImpl });
  assert.equal((await ai.generate({ system: 'S', messages: [{ role: 'user', content: 'x' }] })).text, 'Hi!');
  assert.equal(body.messages[0].role, 'system');
});

test('rate limit is retried once then surfaces as RATE_LIMITED', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
    return jsonRes(429, {});
  };
  const ai = createAIProvider({ ...base, provider: 'gemini', gemini: { apiKey: 'k', model: 'm', baseUrl: 'https://g' } }, { fetchImpl });
  await assert.rejects(ai.generate({ system: '', messages: [] }), { code: 'RATE_LIMITED' });
  assert.equal(calls, 2);
});

test('invalid key surfaces as AUTH without retry', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
    return jsonRes(403, {});
  };
  const ai = createAIProvider({ ...base, provider: 'openai', openai: { apiKey: 'k', model: 'm', baseUrl: 'https://o' } }, { fetchImpl });
  await assert.rejects(ai.generate({ system: '', messages: [] }), { code: 'AUTH' });
  assert.equal(calls, 1);
});

test('unconfigured provider explains instead of faking a reply', async () => {
  const ai = createAIProvider({ ...base, provider: 'none' });
  await assert.rejects(ai.generate({}), { code: 'NOT_CONFIGURED' });
});

test('output guard blocks dosage advice, diagnoses and professional claims', () => {
  assert.equal(guardOutput('Try taking 50 mg of sertraline.').text, SAFE_REPLACEMENT);
  assert.equal(guardOutput('It sounds like you have clinical depression.').text, SAFE_REPLACEMENT);
  assert.equal(guardOutput('As your therapist, I think...').text, SAFE_REPLACEMENT);
  const fine = 'That sounds really hard. Would a short walk help?';
  assert.equal(guardOutput(fine).text, fine);
});

test('system prompt includes context only when provided', () => {
  assert.doesNotMatch(buildSystemPrompt({}), /CONTEXT/);
  const p = buildSystemPrompt({ displayName: 'Frank', recentMood: { label: 'Low', daysAgo: 0 }, level: 'high' });
  assert.match(p, /Frank/);
  assert.match(p, /"Low"/);
  assert.match(p, /possible risk of harm/);
});

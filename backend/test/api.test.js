'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { makeTestApp } = require('./helpers');
const { AIProviderError } = require('../src/services/ai/errors');

test('health endpoint reports store and AI status', async () => {
  const { request } = makeTestApp();
  const res = await request().get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.dataStore, 'memory');
});

test('protected routes reject missing and invalid tokens', async () => {
  const { request } = makeTestApp();
  assert.equal((await request().get('/api/me')).status, 401);
  const bad = await request().get('/api/me').set('Authorization', 'Bearer nope');
  assert.equal(bad.status, 401);
  assert.equal(bad.body.error.code, 'INVALID_TOKEN');
});

test('crisis resources are public', async () => {
  const { request } = makeTestApp();
  const res = await request().get('/api/crisis/resources?region=GB');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.emergency.phone, '999');
});

test('profile is created on first request and can be updated', async () => {
  const { as } = makeTestApp();
  const me = await as('u1').get('/api/me');
  assert.equal(me.status, 200);
  assert.equal(me.body.data.displayName, 'Test User');
  assert.equal(me.body.data.preferences.shareMoodWithAI, false);
  const upd = await as('u1').patch('/api/me', { region: 'ke', preferences: { shareMoodWithAI: true } });
  assert.equal(upd.status, 200);
  assert.equal(upd.body.data.region, 'KE');
  assert.equal(upd.body.data.preferences.shareMoodWithAI, true);
  assert.equal(upd.body.data.preferences.showJokes, true);
});

test('profile rejects unknown fields', async () => {
  const { as } = makeTestApp();
  const res = await as('u1').patch('/api/me', { isAdmin: true });
  assert.equal(res.status, 400);
});

test('mood check-in validates, stores and returns supportive suggestions', async () => {
  const { as } = makeTestApp();
  assert.equal((await as('u1').post('/api/moods', { score: 9 })).status, 400);
  const res = await as('u1').post('/api/moods', { score: 2, emotions: ['lonely', 'tired'], note: 'Long week' });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.entry.label, 'Low');
  assert.ok(res.body.data.support.suggestions.some((s) => s.feature === 'connection'));
  const list = await as('u1').get('/api/moods?days=7');
  assert.equal(list.body.data.length, 1);
});

test('a mood note with risk language flags crisis resources', async () => {
  const { as } = makeTestApp();
  const res = await as('u1').post('/api/moods', { score: 1, note: 'I want to die' });
  assert.equal(res.body.data.entry.safetyLevel, 'high');
  assert.equal(res.body.data.support.safety.showResources, true);
});

test('users cannot see or delete each other\'s data', async () => {
  const { as } = makeTestApp();
  const created = await as('alice').post('/api/moods', { score: 4 });
  const id = created.body.data.entry.id;
  assert.equal((await as('bob').get('/api/moods')).body.data.length, 0);
  assert.equal((await as('bob').delete(`/api/moods/${id}`)).status, 404);
  assert.equal((await as('alice').delete(`/api/moods/${id}`)).status, 200);
});

test('activities: sleep duration is computed across midnight', async () => {
  const { as } = makeTestApp();
  const res = await as('u1').post('/api/activities', { type: 'sleep', night: '2026-10-05', bedTime: '23:30', wakeTime: '07:00', quality: 4 });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.durationMin, 450);
  const bad = await as('u1').post('/api/activities', { type: 'movement', kind: 'walk', minutes: 0, intensity: 'light' });
  assert.equal(bad.status, 400);
});

test('plans: create, complete with mood lift, delete', async () => {
  const { as } = makeTestApp();
  const p = await as('u1').post('/api/plans', { title: 'Coffee with Sam', category: 'connection', date: '2026-10-06', moodBefore: 2 });
  assert.equal(p.status, 201);
  const done = await as('u1').patch(`/api/plans/${p.body.data.id}`, { status: 'done', moodAfter: 4 });
  assert.equal(done.body.data.status, 'done');
  assert.ok(done.body.data.completedAt);
  assert.equal((await as('u1').delete(`/api/plans/${p.body.data.id}`)).status, 200);
});

test('chat: message round trip stores history and titles the session', async () => {
  const { as, aiCalls } = makeTestApp();
  const s = await as('u1').post('/api/chat/sessions', {});
  const sid = s.body.data.id;
  const r = await as('u1').post(`/api/chat/sessions/${sid}/messages`, { text: 'Exams are stressing me out' });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.assistantMessage.source, 'ai');
  assert.equal(r.body.data.safety.level, 'none');
  await as('u1').post(`/api/chat/sessions/${sid}/messages`, { text: 'Mostly maths' });
  assert.equal(aiCalls[1].messages.length, 3, 'second call includes prior turns');
  const got = await as('u1').get(`/api/chat/sessions/${sid}`);
  assert.equal(got.body.data.messages.length, 4);
  assert.equal(got.body.data.session.title, 'Exams are stressing me out');
});

test('chat: imminent risk never calls the AI and returns crisis resources', async () => {
  const { as, aiCalls } = makeTestApp();
  const sid = (await as('u1').post('/api/chat/sessions', {})).body.data.id;
  const r = await as('u1').post(`/api/chat/sessions/${sid}/messages`, { text: "I'm going to kill myself tonight" });
  assert.equal(r.status, 201);
  assert.equal(aiCalls.length, 0);
  assert.equal(r.body.data.safety.level, 'imminent');
  assert.equal(r.body.data.assistantMessage.source, 'safety');
  assert.equal(r.body.data.safety.resources.code, 'KE');
  assert.match(r.body.data.assistantMessage.content, /999/);
});

test('chat: high risk with AI down falls back to crisis message', async () => {
  const t = makeTestApp();
  t.ai.fail = new AIProviderError('TIMEOUT', 'slow', { retryable: true });
  const sid = (await t.as('u1').post('/api/chat/sessions', {})).body.data.id;
  const r = await t.as('u1').post(`/api/chat/sessions/${sid}/messages`, { text: 'I want to die' });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.assistantMessage.source, 'safety-fallback');
  assert.equal(r.body.data.aiError.code, 'TIMEOUT');
});

test('chat: ordinary message with AI down returns an error and saves nothing', async () => {
  const t = makeTestApp();
  t.ai.fail = new AIProviderError('NOT_CONFIGURED', 'not configured');
  const sid = (await t.as('u1').post('/api/chat/sessions', {})).body.data.id;
  const r = await t.as('u1').post(`/api/chat/sessions/${sid}/messages`, { text: 'hello' });
  assert.equal(r.status, 503);
  assert.equal(r.body.error.code, 'AI_NOT_CONFIGURED');
  const got = await t.as('u1').get(`/api/chat/sessions/${sid}`);
  assert.equal(got.body.data.messages.length, 0);
});

test('chat: AI output guard replaces medication advice', async () => {
  const t = makeTestApp();
  t.ai.reply = 'You could take 20 mg of fluoxetine.';
  const sid = (await t.as('u1').post('/api/chat/sessions', {})).body.data.id;
  const r = await t.as('u1').post(`/api/chat/sessions/${sid}/messages`, { text: 'Should I take meds?' });
  assert.equal(r.body.data.assistantMessage.source, 'guarded');
  assert.doesNotMatch(r.body.data.assistantMessage.content, /mg/);
});

test('chat: mood is only shared with the AI after opting in', async () => {
  const t = makeTestApp();
  await t.as('u1').post('/api/moods', { score: 2 });
  const sid = (await t.as('u1').post('/api/chat/sessions', {})).body.data.id;
  await t.as('u1').post(`/api/chat/sessions/${sid}/messages`, { text: 'hi' });
  assert.doesNotMatch(t.aiCalls[0].system, /mood check-in/);
  await t.as('u1').patch('/api/me', { preferences: { shareMoodWithAI: true } });
  await t.as('u1').post(`/api/chat/sessions/${sid}/messages`, { text: 'hi again' });
  assert.match(t.aiCalls[1].system, /"Low"/);
});

test('chat: sessions can be deleted individually and all at once', async () => {
  const { as } = makeTestApp();
  const a = (await as('u1').post('/api/chat/sessions', {})).body.data.id;
  await as('u1').post('/api/chat/sessions', {});
  assert.equal((await as('u1').delete(`/api/chat/sessions/${a}`)).status, 200);
  assert.equal((await as('u1').get('/api/chat/sessions')).body.data.length, 1);
  assert.equal((await as('u1').delete('/api/chat/sessions')).body.data.deleted, 1);
});

test('dashboard summarises the week', async () => {
  const { as } = makeTestApp();
  await as('u1').post('/api/moods', { score: 4, emotions: ['calm'] });
  await as('u1').post('/api/activities', { type: 'movement', kind: 'walk', minutes: 30, intensity: 'moderate' });
  await as('u1').post('/api/activities', { type: 'breathing', pattern: 'calm', durationSec: 60 });
  const d = await as('u1').get('/api/dashboard');
  assert.equal(d.status, 200);
  assert.equal(d.body.data.mood.checkedInToday, true);
  assert.equal(d.body.data.movement.whoMinutesThisWeek, 30);
  assert.equal(d.body.data.calm.breathingThisWeek, 1);
  assert.equal(d.body.data.mood.series.length, 30);
});

test('daily content hides the joke on a hard day', async () => {
  const { as } = makeTestApp();
  const a = await as('u1').get('/api/content/daily');
  assert.ok(a.body.data.quote.text);
  assert.ok(a.body.data.joke);
  await as('u1').post('/api/moods', { score: 1 });
  const b = await as('u1').get('/api/content/daily');
  assert.equal(b.body.data.joke, null);
  assert.equal(b.body.data.jokeHiddenReason, 'gentle-day');
  assert.equal(b.body.data.tone, 'low');
});

test('export returns all data and delete removes it', async () => {
  const t = makeTestApp();
  await t.as('u1').post('/api/moods', { score: 3 });
  const sid = (await t.as('u1').post('/api/chat/sessions', {})).body.data.id;
  await t.as('u1').post(`/api/chat/sessions/${sid}/messages`, { text: 'hi' });
  const ex = await t.as('u1').get('/api/me/export');
  assert.equal(ex.body.data.moods.length, 1);
  assert.equal(ex.body.data.chats[0].messages.length, 2);
  await t.as('u1').delete('/api/me');
  assert.deepEqual(t.deleted, ['u1']);
  assert.equal((await t.as('u1').get('/api/moods')).body.data.length, 0);
});

test('unknown routes and bad JSON return the standard error envelope', async () => {
  const { request } = makeTestApp();
  const r = await request().get('/api/nope');
  assert.equal(r.body.ok, false);
  const j = await request().post('/api/moods').set('Authorization', 'Bearer test:u1').set('Content-Type', 'application/json').send('{bad');
  assert.equal(j.status, 400);
  assert.equal(j.body.error.code, 'INVALID_JSON');
});

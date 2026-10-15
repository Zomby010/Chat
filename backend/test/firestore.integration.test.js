'use strict';

/**
 * Integration tests against the Firebase Emulator Suite (Auth + Firestore).
 * Run with:  npm run test:emulator   (from the backend folder)
 * They are skipped when the emulators are not running.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const enabled = Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST);
const opts = { skip: !enabled && 'Firebase emulators not running' };

async function emulatorUser(email) {
  const host = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const res = await fetch(`http://${host}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Passw0rd!', returnSecureToken: true }),
  });
  const body = await res.json();
  if (!body.idToken) throw new Error(`emulator sign-up failed: ${JSON.stringify(body)}`);
  return body;
}

test('full API flow against Firestore + Auth emulators', opts, async () => {
  const { loadConfig } = require('../src/config/env');
  const { getFirebaseServices } = require('../src/config/firebase');
  const { createFirestoreRepository } = require('../src/repositories/firestore.repository');
  const { createApp } = require('../src/app');
  const { createLogger } = require('../src/utils/logger');

  const config = loadConfig({ ...process.env, NODE_ENV: 'test', DATA_STORE: 'firestore', FIREBASE_PROJECT_ID: 'demo-mindmate', DEFAULT_REGION: 'KE' });
  const { auth, db } = getFirebaseServices(config.firebase);
  const repo = createFirestoreRepository(db);
  const ai = { name: 'test', model: 't', async generate() { return { text: 'I hear you.' }; } };
  const app = createApp({
    config,
    repo,
    ai,
    verifyToken: (t) => auth.verifyIdToken(t),
    deleteAuthUser: (uid) => auth.deleteUser(uid),
    logger: createLogger('error', { silent: true }),
  });

  const alice = await emulatorUser(`alice${Date.now()}@example.com`);
  const bob = await emulatorUser(`bob${Date.now()}@example.com`);
  const A = { Authorization: `Bearer ${alice.idToken}` };
  const B = { Authorization: `Bearer ${bob.idToken}` };

  const me = await request(app).get('/api/me').set(A);
  assert.equal(me.status, 200, JSON.stringify(me.body));

  const m1 = await request(app).post('/api/moods').set(A).send({ score: 2, emotions: ['tired'] });
  assert.equal(m1.status, 201);
  await request(app).post('/api/moods').set(A).send({ score: 4 });
  const moods = await request(app).get('/api/moods').set(A);
  assert.equal(moods.body.data.length, 2);
  assert.equal(moods.body.data[0].score, 4, 'newest first');
  assert.equal((await request(app).get('/api/moods').set(B)).body.data.length, 0, 'isolation between users');

  const plan = await request(app).post('/api/plans').set(A).send({ title: 'Walk with music', category: 'movement', date: '2026-10-06' });
  const upd = await request(app).patch(`/api/plans/${plan.body.data.id}`).set(A).send({ status: 'done', moodAfter: 4 });
  assert.equal(upd.body.data.status, 'done');

  const sid = (await request(app).post('/api/chat/sessions').set(A).send({})).body.data.id;
  const msg = await request(app).post(`/api/chat/sessions/${sid}/messages`).set(A).send({ text: 'hello' });
  assert.equal(msg.status, 201, JSON.stringify(msg.body));
  const s = await request(app).get(`/api/chat/sessions/${sid}`).set(A);
  assert.equal(s.body.data.messages.length, 2);
  assert.equal(s.body.data.messages[0].role, 'user');

  const dash = await request(app).get('/api/dashboard').set(A);
  assert.equal(dash.status, 200);
  assert.equal(dash.body.data.mood.checkInsThisWeek, 2);

  // Deleting a session removes its messages sub-collection.
  await request(app).delete(`/api/chat/sessions/${sid}`).set(A);
  const msgs = await db.collection(`users/${alice.localId}/chatSessions/${sid}/messages`).get();
  assert.equal(msgs.size, 0);

  // Account deletion removes data and the auth user.
  assert.equal((await request(app).delete('/api/me').set(A)).status, 200);
  assert.equal((await db.doc(`users/${alice.localId}`).get()).exists, false);
  await assert.rejects(auth.getUser(alice.localId));
});

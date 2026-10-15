'use strict';

const request = require('supertest');
const { createApp } = require('../src/app');
const { loadConfig } = require('../src/config/env');
const { createMemoryRepository } = require('../src/repositories/memory.repository');
const { createLogger } = require('../src/utils/logger');

/**
 * Builds the real app with test doubles injected at its boundaries:
 * an in-memory repository, a token verifier and a scripted AI provider.
 * Nothing in src/ knows about these doubles.
 */
function makeTestApp({ ai, defaultRegion = 'KE' } = {}) {
  const config = loadConfig({ NODE_ENV: 'test', DATA_STORE: 'memory', DEFAULT_REGION: defaultRegion, CORS_ORIGINS: 'http://localhost:5173' });
  const repo = createMemoryRepository();
  const calls = [];
  const scriptedAi = ai || {
    name: 'test',
    model: 'test-model',
    reply: 'That sounds like a lot to hold. What feels heaviest right now?',
    async generate(args) {
      calls.push(args);
      if (this.fail) throw this.fail;
      return { text: this.reply, model: 'test-model' };
    },
  };
  const verifyToken = async (token) => {
    const m = token.match(/^test:([\w-]+)$/);
    if (!m) throw Object.assign(new Error('bad token'), { code: 'auth/argument-error' });
    return { uid: m[1], email: `${m[1]}@example.com`, name: 'Test User' };
  };
  const deleted = [];
  const app = createApp({
    config,
    repo,
    ai: scriptedAi,
    verifyToken,
    deleteAuthUser: async (uid) => deleted.push(uid),
    logger: createLogger('error', { silent: true }),
  });
  const as = (uid) => {
    const auth = { Authorization: `Bearer test:${uid}` };
    return {
      get: (url) => request(app).get(url).set(auth),
      post: (url, body) => request(app).post(url).set(auth).send(body),
      patch: (url, body) => request(app).patch(url).set(auth).send(body),
      delete: (url) => request(app).delete(url).set(auth),
    };
  };
  return { app, repo, ai: scriptedAi, aiCalls: calls, deleted, as, request: () => request(app) };
}

module.exports = { makeTestApp };

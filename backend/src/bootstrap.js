'use strict';

const { loadConfig } = require('./config/env');
const { createLogger } = require('./utils/logger');
const { createApp } = require('./app');
const { createAIProvider } = require('./services/ai');
const { createMemoryRepository } = require('./repositories/memory.repository');
const { createFirestoreRepository } = require('./repositories/firestore.repository');
const AppError = require('./utils/AppError');

/**
 * Wires the real dependencies (config, Firebase, AI provider) into the app.
 * Shared by the long-running server (server.js) and the Vercel function
 * (api/index.js at the repo root). Throws if the configuration is invalid.
 */
function buildApp(env = process.env) {
  const config = loadConfig(env);
  const logger = createLogger(config.logLevel);

  let repo;
  let verifyToken;
  let deleteAuthUser;
  let authStatus = 'firebase';

  if (config.firebase.hasCredentials) {
    const { getFirebaseServices } = require('./config/firebase');
    const { auth, db } = getFirebaseServices(config.firebase);
    verifyToken = (token) => auth.verifyIdToken(token, true); // true = also reject revoked sessions
    deleteAuthUser = (uid) => auth.deleteUser(uid);
    repo = config.dataStore === 'firestore' ? createFirestoreRepository(db) : createMemoryRepository();
    if (config.firebase.usingEmulator) authStatus = 'firebase-emulator';
  } else {
    // Without Firebase credentials nobody can sign in. Fail every protected
    // request with a clear message rather than silently accepting tokens.
    authStatus = 'not-configured';
    const notConfigured = () => {
      throw new AppError(503, 'AUTH_NOT_CONFIGURED', 'Sign-in is not configured on this server. Add Firebase credentials to the server environment.');
    };
    verifyToken = notConfigured;
    deleteAuthUser = notConfigured;
    repo = createMemoryRepository();
  }

  const ai = createAIProvider(config.ai);
  const app = createApp({ config, repo, ai, verifyToken, deleteAuthUser, logger, status: { auth: authStatus } });
  return { app, config, logger, repo, ai, authStatus };
}

module.exports = { buildApp };

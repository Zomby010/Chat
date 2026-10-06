'use strict';

const { loadConfig } = require('./config/env');
const { createLogger } = require('./utils/logger');
const { createApp } = require('./app');
const { createAIProvider } = require('./services/ai');
const { createMemoryRepository } = require('./repositories/memory.repository');
const { createFirestoreRepository } = require('./repositories/firestore.repository');
const AppError = require('./utils/AppError');

function main() {
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    process.stderr.write(`\n${err.message}\n\nSee backend/.env.example for every supported variable.\n\n`);
    process.exit(1);
  }
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
      throw new AppError(503, 'AUTH_NOT_CONFIGURED', 'Sign-in is not configured on this server. Add Firebase credentials to backend/.env.');
    };
    verifyToken = notConfigured;
    deleteAuthUser = notConfigured;
    repo = createMemoryRepository();
  }

  const ai = createAIProvider(config.ai);
  const app = createApp({ config, repo, ai, verifyToken, deleteAuthUser, logger, status: { auth: authStatus } });

  const server = app.listen(config.port, () => {
    logger.info('server_started', {
      port: config.port,
      env: config.env,
      dataStore: repo.kind,
      auth: authStatus,
      ai: ai.name === 'none' ? 'not configured' : `${ai.name} (${ai.model})`,
    });
    if (repo.kind === 'memory') logger.warn('memory_store', { msg: 'Data is kept in memory and will be lost on restart.' });
    if (ai.name === 'none') logger.warn('ai_not_configured', { msg: 'Set GEMINI_API_KEY or OPENAI_API_KEY to enable the chat companion.' });
  });

  const shutdown = (signal) => {
    logger.info('shutdown', { signal });
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main();

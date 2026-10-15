'use strict';

const { buildApp } = require('./bootstrap');

function main() {
  let built;
  try {
    built = buildApp();
  } catch (err) {
    process.stderr.write(`\n${err.message}\n\nSee backend/.env.example for every supported variable.\n\n`);
    process.exit(1);
  }
  const { app, config, logger, repo, ai, authStatus } = built;

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

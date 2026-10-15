'use strict';

/**
 * Vercel serverless entry point. vercel.json rewrites every /api/* request
 * here, and Express routes it as usual (the original URL is preserved).
 * The app is built once per warm instance and reused between requests.
 */
let handler;
try {
  handler = require('../backend/src/bootstrap').buildApp().app;
} catch (err) {
  // Misconfiguration (for example a missing environment variable): answer with
  // the reason instead of crashing, so /api/health shows what to fix.
  // The message names variables, never their values.
  const isConfigError = /^(Configuration error|Invalid environment configuration)/.test(err.message);
  const message = isConfigError ? err.message : 'The server failed to start. Check the function logs in the Vercel dashboard.';
  console.error('MindMate API failed to start:', err);
  const body = JSON.stringify({ ok: false, error: { code: 'SERVER_NOT_CONFIGURED', message } });
  handler = (_req, res) => {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(body);
  };
}

module.exports = handler;

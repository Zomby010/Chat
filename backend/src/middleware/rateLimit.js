'use strict';

const { rateLimit } = require('express-rate-limit');

const json429 = (message) => (req, res) =>
  res.status(429).json({ ok: false, error: { code: 'RATE_LIMITED', message } });

/** General API limit, per user when signed in, otherwise per IP. */
function apiLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: json429('Too many requests. Please wait a moment and try again.'),
  });
}

/** Stricter limit for AI calls, keyed by authenticated user (cost control). */
function chatLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: 12,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => `chat:${req.user?.uid}`,
    handler: json429("You're sending messages quickly. Take a breath, and try again in a minute."),
  });
}

module.exports = { apiLimiter, chatLimiter };

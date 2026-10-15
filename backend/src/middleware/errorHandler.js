'use strict';

const AppError = require('../utils/AppError');
const { AIProviderError } = require('../services/ai');

const AI_STATUS = {
  NOT_CONFIGURED: 503,
  TIMEOUT: 504,
  RATE_LIMITED: 503,
  AUTH: 503,
  BLOCKED: 422,
  UPSTREAM: 502,
  EMPTY: 502,
};

function notFoundHandler(req, _res, next) {
  next(new AppError(404, 'ROUTE_NOT_FOUND', `No endpoint for ${req.method} ${req.path}.`));
}

/**
 * Consistent error envelope: { ok: false, error: { code, message, details? } }.
 * Internal error details are logged server-side, never sent to the client.
 */
function createErrorHandler(logger) {
  // eslint-disable-next-line no-unused-vars
  return function errorHandler(err, req, res, _next) {
    if (err?.type === 'entity.too.large') {
      return res.status(413).json({ ok: false, error: { code: 'PAYLOAD_TOO_LARGE', message: 'That request is too large.' } });
    }
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({ ok: false, error: { code: 'INVALID_JSON', message: 'The request body is not valid JSON.' } });
    }
    if (err instanceof AppError) {
      return res.status(err.status).json({ ok: false, error: { code: err.code, message: err.message, details: err.details } });
    }
    if (err instanceof AIProviderError) {
      logger.warn('ai_error', { code: err.code, upstreamStatus: err.upstreamStatus, path: req.path });
      return res.status(AI_STATUS[err.code] || 502).json({ ok: false, error: { code: `AI_${err.code}`, message: err.message } });
    }
    logger.error('unhandled_error', { path: req.path, method: req.method, name: err?.name, message: err?.message, stack: err?.stack });
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on our side. Please try again.' } });
  };
}

module.exports = { notFoundHandler, createErrorHandler };

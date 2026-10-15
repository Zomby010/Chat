'use strict';

/** Logs method, route, status and duration only. Never bodies or tokens. */
function createRequestLogger(logger) {
  return (req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      logger.info('request', {
        method: req.method,
        path: req.baseUrl + (req.route?.path || req.path),
        status: res.statusCode,
        ms: Math.round(ms),
      });
    });
    next();
  };
}

module.exports = { createRequestLogger };

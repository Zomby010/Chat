'use strict';

/**
 * Minimal structured logger. Deliberately never logs request bodies:
 * MindMate handles sensitive wellbeing data, so message text, notes and
 * AI responses must not end up in server logs.
 */
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

function createLogger(level = 'info', { silent = false } = {}) {
  const threshold = LEVELS[level] ?? LEVELS.info;
  const write = (lvl, msg, meta) => {
    if (silent || LEVELS[lvl] < threshold) return;
    const line = JSON.stringify({ time: new Date().toISOString(), level: lvl, msg, ...meta });
    (lvl === 'error' || lvl === 'warn' ? process.stderr : process.stdout).write(line + '\n');
  };
  return {
    debug: (msg, meta) => write('debug', msg, meta),
    info: (msg, meta) => write('info', msg, meta),
    warn: (msg, meta) => write('warn', msg, meta),
    error: (msg, meta) => write('error', msg, meta),
  };
}

module.exports = { createLogger };

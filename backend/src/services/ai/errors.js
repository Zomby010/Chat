'use strict';

/** Normalised error raised by any AI provider. */
class AIProviderError extends Error {
  /**
   * @param {'NOT_CONFIGURED'|'TIMEOUT'|'RATE_LIMITED'|'AUTH'|'BLOCKED'|'UPSTREAM'|'EMPTY'} code
   */
  constructor(code, message, { status, retryable = false } = {}) {
    super(message);
    this.name = 'AIProviderError';
    this.code = code;
    this.upstreamStatus = status;
    this.retryable = retryable;
  }
}

module.exports = { AIProviderError };

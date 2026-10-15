'use strict';

const { createGeminiProvider } = require('./gemini.provider');
const { createOpenAIProvider } = require('./openai.provider');
const { AIProviderError } = require('./errors');

/** A provider that always explains it is not configured (no fake replies). */
function createUnconfiguredProvider() {
  return {
    name: 'none',
    model: null,
    async generate() {
      throw new AIProviderError(
        'NOT_CONFIGURED',
        'The AI companion is not configured on this server yet. Add GEMINI_API_KEY or OPENAI_API_KEY to backend/.env.'
      );
    },
  };
}

/** Wraps a provider with one retry on transient failures. */
function withRetry(provider, { retries = 1, delayMs = 800 } = {}) {
  return {
    ...provider,
    async generate(args) {
      let lastErr;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          return await provider.generate(args);
        } catch (err) {
          lastErr = err;
          if (!(err instanceof AIProviderError) || !err.retryable || attempt === retries) throw err;
          await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
        }
      }
      throw lastErr;
    },
  };
}

function createAIProvider(aiConfig, { fetchImpl } = {}) {
  const common = { timeoutMs: aiConfig.timeoutMs, maxOutputTokens: aiConfig.maxOutputTokens, fetchImpl };
  switch (aiConfig.provider) {
    case 'gemini':
      return withRetry(createGeminiProvider({ ...aiConfig.gemini, ...common }));
    case 'openai':
      return withRetry(createOpenAIProvider({ ...aiConfig.openai, ...common }));
    default:
      return createUnconfiguredProvider();
  }
}

module.exports = { createAIProvider, withRetry, AIProviderError };

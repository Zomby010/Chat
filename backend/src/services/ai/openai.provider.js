'use strict';

const { postJson } = require('./http');
const { AIProviderError } = require('./errors');

/**
 * OpenAI Chat Completions via REST.
 * Docs: https://platform.openai.com/docs/api-reference/chat
 */
function createOpenAIProvider({ apiKey, model, baseUrl, timeoutMs, maxOutputTokens, fetchImpl }) {
  return {
    name: 'openai',
    model,
    async generate({ system, messages, temperature = 0.7 }) {
      const url = `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
      const data = await postJson(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
        body: {
          model,
          temperature,
          max_tokens: maxOutputTokens,
          messages: [{ role: 'system', content: system }, ...messages.map((m) => ({ role: m.role, content: m.content }))],
        },
        timeoutMs,
        fetchImpl,
      });
      const choice = data?.choices?.[0];
      const text = (choice?.message?.content || '').trim();
      if (!text) {
        if (choice?.finish_reason === 'content_filter') throw new AIProviderError('BLOCKED', 'The AI service declined to answer.');
        throw new AIProviderError('EMPTY', 'The AI service returned an empty reply.', { retryable: true });
      }
      return { text, model };
    },
  };
}

module.exports = { createOpenAIProvider };

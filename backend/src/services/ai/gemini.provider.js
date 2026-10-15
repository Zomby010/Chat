'use strict';

const { postJson } = require('./http');
const { AIProviderError } = require('./errors');

/**
 * Google Gemini via the REST generateContent endpoint.
 * Docs: https://ai.google.dev/api/generate-content
 */
function createGeminiProvider({ apiKey, model, baseUrl, timeoutMs, maxOutputTokens, fetchImpl }) {
  return {
    name: 'gemini',
    model,
    async generate({ system, messages, temperature = 0.7 }) {
      const url = `${baseUrl.replace(/\/$/, '')}/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      const body = {
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: { temperature, maxOutputTokens },
      };
      const data = await postJson(url, {
        headers: { 'x-goog-api-key': apiKey },
        body,
        timeoutMs,
        fetchImpl,
      });

      if (data?.promptFeedback?.blockReason) {
        throw new AIProviderError('BLOCKED', `The AI service blocked this message (${data.promptFeedback.blockReason}).`);
      }
      const candidate = data?.candidates?.[0];
      const text = (candidate?.content?.parts || []).map((p) => p.text || '').join('').trim();
      if (!text) {
        if (candidate?.finishReason === 'SAFETY') throw new AIProviderError('BLOCKED', 'The AI service declined to answer.');
        throw new AIProviderError('EMPTY', 'The AI service returned an empty reply.', { retryable: true });
      }
      return { text, model };
    },
  };
}

module.exports = { createGeminiProvider };

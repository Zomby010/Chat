'use strict';

const { AIProviderError } = require('./errors');

/** POST JSON with a timeout; maps transport failures to AIProviderError. */
async function postJson(url, { headers, body, timeoutMs, fetchImpl = fetch }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw new AIProviderError('TIMEOUT', 'The AI service took too long to respond.', { retryable: true });
    throw new AIProviderError('UPSTREAM', 'Could not reach the AI service.', { retryable: true });
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const status = res.status;
    if (status === 401 || status === 403) throw new AIProviderError('AUTH', 'The AI service rejected the API key.', { status });
    if (status === 429) throw new AIProviderError('RATE_LIMITED', 'The AI service is busy (rate limit or quota reached).', { status, retryable: true });
    if (status === 400) throw new AIProviderError('UPSTREAM', 'The AI service rejected the request.', { status });
    throw new AIProviderError('UPSTREAM', `The AI service returned an error (${status}).`, { status, retryable: status >= 500 });
  }
  return data;
}

module.exports = { postJson };

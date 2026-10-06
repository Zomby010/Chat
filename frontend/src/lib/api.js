/**
 * MindMate API client.
 * - Attaches the Firebase ID token to every request.
 * - Refreshes the token once if the server reports it expired.
 * - Normalises every failure into an ApiError with a readable message.
 */
import { auth } from './firebase';

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN', details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
  get isNetwork() {
    return this.code === 'NETWORK_ERROR';
  }
  get isAuth() {
    return this.status === 401;
  }
}

let onUnauthorized = () => {};
/** Lets the auth layer react when the session can no longer be used. */
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export const tzOffset = () => new Date().getTimezoneOffset();

async function getToken(force = false) {
  const user = auth?.currentUser;
  return user ? user.getIdToken(force) : null;
}

async function request(method, path, { body, query, auth: needsAuth = true, retry = true } = {}) {
  const url = new URL(`${BASE}/api${path}`, window.location.origin);
  if (query) Object.entries(query).forEach(([k, v]) => v !== undefined && v !== null && url.searchParams.set(k, v));

  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (needsAuth) {
    const token = await getToken();
    if (!token) throw new ApiError('Please sign in to continue.', { status: 401, code: 'AUTH_REQUIRED' });
    headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('We can’t reach MindMate right now. Check your connection, or try again in a moment.', { code: 'NETWORK_ERROR' });
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (res.ok && payload?.ok !== false) return payload?.data;

  const err = payload?.error || {};
  if (res.status === 401 && needsAuth && retry && err.code === 'TOKEN_EXPIRED') {
    await getToken(true);
    return request(method, path, { body, query, auth: needsAuth, retry: false });
  }
  if (res.status === 401 && needsAuth) onUnauthorized(err);
  const fallback =
    res.status >= 500 ? 'MindMate’s server had a problem. Please try again shortly.' : 'That request didn’t work. Please try again.';
  throw new ApiError(err.message || fallback, { status: res.status, code: err.code || `HTTP_${res.status}`, details: err.details });
}

export const api = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, body, opts) => request('POST', path, { ...opts, body: body ?? {} }),
  patch: (path, body, opts) => request('PATCH', path, { ...opts, body }),
  del: (path, opts) => request('DELETE', path, opts),
};

/** Field-level messages from a VALIDATION_ERROR response, keyed by field. */
export function fieldErrors(error) {
  const out = {};
  for (const f of error?.details?.fields || []) out[f.field] = f.message;
  return out;
}

'use strict';

const crypto = require('crypto');

/**
 * In-memory implementation of the data repository.
 * Used by the automated tests and for local development when no Firebase
 * credentials are configured. Data is lost when the process stops.
 */
function createMemoryRepository() {
  /** Map<pathString, Map<id, doc>> */
  const collections = new Map();
  const users = new Map();

  const key = (uid, path) => [uid, ...path].join('/');
  const coll = (uid, path) => {
    const k = key(uid, path);
    if (!collections.has(k)) collections.set(k, new Map());
    return collections.get(k);
  };
  const clone = (v) => (v === undefined ? undefined : structuredClone(v));

  return {
    kind: 'memory',

    async getUser(uid) {
      return clone(users.get(uid)) || null;
    },
    async createUserIfMissing(uid, data) {
      if (!users.has(uid)) users.set(uid, { ...data });
      return clone(users.get(uid));
    },
    async setUser(uid, data, { merge = true } = {}) {
      const next = merge ? { ...(users.get(uid) || {}), ...data } : { ...data };
      users.set(uid, next);
      return clone(next);
    },

    async create(uid, path, data) {
      const id = data.id || crypto.randomUUID();
      const doc = { ...data, id };
      coll(uid, path).set(id, doc);
      return clone(doc);
    },
    async get(uid, path, id) {
      return clone(coll(uid, path).get(id)) || null;
    },
    async update(uid, path, id, patch) {
      const c = coll(uid, path);
      if (!c.has(id)) return null;
      const next = { ...c.get(id), ...patch, id };
      c.set(id, next);
      return clone(next);
    },
    async remove(uid, path, id) {
      const c = coll(uid, path);
      const existed = c.delete(id);
      // Cascade: remove any sub-collections under this document.
      const prefix = key(uid, [...path, id]) + '/';
      for (const k of [...collections.keys()]) if (k.startsWith(prefix)) collections.delete(k);
      return existed;
    },
    /**
     * @param {{ orderBy?: string, direction?: 'asc'|'desc', since?: string, until?: string, limit?: number }} q
     */
    async list(uid, path, { orderBy = 'createdAt', direction = 'desc', since, until, limit = 100 } = {}) {
      let docs = [...coll(uid, path).values()];
      if (since) docs = docs.filter((d) => d[orderBy] >= since);
      if (until) docs = docs.filter((d) => d[orderBy] <= until);
      docs.sort((a, b) => (a[orderBy] < b[orderBy] ? -1 : a[orderBy] > b[orderBy] ? 1 : 0));
      if (direction === 'desc') docs.reverse();
      return clone(docs.slice(0, limit));
    },

    async deleteAllUserData(uid) {
      users.delete(uid);
      for (const k of [...collections.keys()]) if (k.startsWith(uid + '/')) collections.delete(k);
    },

    async ping() {
      return true;
    },
  };
}

module.exports = { createMemoryRepository };

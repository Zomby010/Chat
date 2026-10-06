'use strict';

/**
 * Firestore implementation of the data repository (firebase-admin).
 *
 * Data model (all private to one user):
 *   users/{uid}
 *   users/{uid}/moods/{id}
 *   users/{uid}/activities/{id}
 *   users/{uid}/plans/{id}
 *   users/{uid}/chatSessions/{sessionId}
 *   users/{uid}/chatSessions/{sessionId}/messages/{id}
 *
 * The Admin SDK bypasses security rules, so authorisation is enforced by the
 * API (every path is rooted at the authenticated uid). firestore.rules denies
 * all direct client access as a second line of defence.
 */
function createFirestoreRepository(db) {
  const userDoc = (uid) => db.collection('users').doc(uid);
  const collRef = (uid, path) => {
    let ref = userDoc(uid);
    for (let i = 0; i < path.length; i++) {
      ref = i % 2 === 0 ? ref.collection(path[i]) : ref.doc(path[i]);
    }
    return ref;
  };
  const toDoc = (snap) => (snap.exists ? { ...snap.data(), id: snap.id } : null);

  return {
    kind: 'firestore',

    async getUser(uid) {
      const snap = await userDoc(uid).get();
      return snap.exists ? snap.data() : null;
    },
    /** Creates the user document only if it does not exist (race-safe). */
    async createUserIfMissing(uid, data) {
      try {
        await userDoc(uid).create(data);
        return data;
      } catch (err) {
        if (err.code === 6) return (await userDoc(uid).get()).data(); // ALREADY_EXISTS
        throw err;
      }
    },
    async setUser(uid, data, { merge = true } = {}) {
      await userDoc(uid).set(data, { merge });
      return (await userDoc(uid).get()).data();
    },

    async create(uid, path, data) {
      const c = collRef(uid, path);
      const ref = data.id ? c.doc(data.id) : c.doc();
      const doc = { ...data, id: ref.id };
      await ref.set(doc);
      return doc;
    },
    async get(uid, path, id) {
      return toDoc(await collRef(uid, path).doc(id).get());
    },
    async update(uid, path, id, patch) {
      const ref = collRef(uid, path).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return null;
      await ref.update(patch);
      return toDoc(await ref.get());
    },
    async remove(uid, path, id) {
      const ref = collRef(uid, path).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return false;
      await db.recursiveDelete(ref); // also deletes sub-collections (e.g. messages)
      return true;
    },
    async list(uid, path, { orderBy = 'createdAt', direction = 'desc', since, until, limit = 100 } = {}) {
      let q = collRef(uid, path);
      if (since) q = q.where(orderBy, '>=', since);
      if (until) q = q.where(orderBy, '<=', until);
      q = q.orderBy(orderBy, direction).limit(limit);
      const snap = await q.get();
      return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
    },

    async deleteAllUserData(uid) {
      await db.recursiveDelete(userDoc(uid));
    },

    async ping() {
      await db.collection('_health').limit(1).get();
      return true;
    },
  };
}

module.exports = { createFirestoreRepository };

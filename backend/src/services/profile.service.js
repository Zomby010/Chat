'use strict';

const DEFAULT_PREFERENCES = Object.freeze({
  shareNameWithAI: true,
  shareMoodWithAI: false, // off by default: mood data is only sent to the AI provider if the user opts in
  weeklyMovementGoal: 150, // WHO: 150–300 minutes of moderate activity per week
  sleepGoalHours: 8,
  showJokes: true,
});

function createProfileService({ repo }) {
  const withDefaults = (doc) => ({
    displayName: doc.displayName || '',
    email: doc.email || null,
    region: doc.region || null,
    preferences: { ...DEFAULT_PREFERENCES, ...(doc.preferences || {}) },
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });

  return {
    /** Returns the profile, creating it on first sign-in. */
    async getOrCreate(user) {
      const existing = await repo.getUser(user.uid);
      if (existing) return withDefaults(existing);
      const now = new Date().toISOString();
      const fallbackName = user.name || (user.email ? user.email.split('@')[0] : '');
      const doc = {
        displayName: fallbackName.slice(0, 60),
        email: user.email || null,
        region: null,
        preferences: { ...DEFAULT_PREFERENCES },
        createdAt: now,
        updatedAt: now,
      };
      await repo.setUser(user.uid, doc, { merge: false });
      return withDefaults(doc);
    },

    async update(user, patch) {
      const current = await this.getOrCreate(user);
      const next = {
        ...(patch.displayName !== undefined && { displayName: patch.displayName }),
        ...(patch.region !== undefined && { region: patch.region }),
        preferences: { ...current.preferences, ...(patch.preferences || {}) },
        updatedAt: new Date().toISOString(),
      };
      const saved = await repo.setUser(user.uid, next, { merge: true });
      return withDefaults(saved);
    },

    /** Everything MindMate stores about the user, as one JSON document. */
    async exportAll(user) {
      const profile = await this.getOrCreate(user);
      const opts = { limit: 10000 };
      const [moods, activities, plans, sessions] = await Promise.all([
        repo.list(user.uid, ['moods'], opts),
        repo.list(user.uid, ['activities'], opts),
        repo.list(user.uid, ['plans'], { ...opts, orderBy: 'date' }),
        repo.list(user.uid, ['chatSessions'], { ...opts, orderBy: 'updatedAt' }),
      ]);
      const chats = await Promise.all(
        sessions.map(async (s) => ({
          ...s,
          messages: await repo.list(user.uid, ['chatSessions', s.id, 'messages'], { ...opts, direction: 'asc' }),
        }))
      );
      return { exportedAt: new Date().toISOString(), profile, moods, activities, plans, chats };
    },

    async deleteAllData(user) {
      await repo.deleteAllUserData(user.uid);
    },
  };
}

module.exports = { createProfileService, DEFAULT_PREFERENCES };

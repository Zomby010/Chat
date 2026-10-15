'use strict';

const AppError = require('../utils/AppError');
const { toDayKey, daysAgo, compact } = require('../utils/dates');

/**
 * Behavioural activation: scheduling small, meaningful activities and noticing
 * how mood changes before and after them.
 */
function createPlanService({ repo }) {
  const path = ['plans'];
  return {
    async create(uid, input) {
      const now = new Date().toISOString();
      return repo.create(uid, path, { ...compact(input), status: 'planned', createdAt: now, updatedAt: now });
    },

    async list(uid, { days = 30 } = {}) {
      const since = toDayKey(daysAgo(days));
      return repo.list(uid, path, { orderBy: 'date', direction: 'asc', since, limit: 500 });
    },

    async update(uid, id, patch) {
      const extra = { updatedAt: new Date().toISOString() };
      if (patch.status === 'done') extra.completedAt = extra.updatedAt;
      const updated = await repo.update(uid, path, id, compact({ ...patch, ...extra }));
      if (!updated) throw AppError.notFound('That plan no longer exists.');
      return updated;
    },

    async remove(uid, id) {
      const ok = await repo.remove(uid, path, id);
      if (!ok) throw AppError.notFound('That plan no longer exists.');
    },
  };
}

module.exports = { createPlanService };

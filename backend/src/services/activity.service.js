'use strict';

const AppError = require('../utils/AppError');
const { toDayKey, daysAgo } = require('../utils/dates');

const ACTIVITY_TYPES = ['breathing', 'mindfulness', 'movement', 'connection', 'sleep'];

/** Minutes between bed and wake time, handling sleep across midnight. */
function sleepMinutes(bedTime, wakeTime) {
  const [bh, bm] = bedTime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  let mins = wh * 60 + wm - (bh * 60 + bm);
  if (mins <= 0) mins += 24 * 60;
  return mins;
}

function createActivityService({ repo }) {
  const path = ['activities'];
  return {
    async create(uid, input) {
      const { tzOffset = 0, ...data } = input;
      const now = new Date();
      const doc = { ...data, createdAt: now.toISOString(), day: toDayKey(now, tzOffset) };
      if (data.type === 'sleep') {
        doc.durationMin = sleepMinutes(data.bedTime, data.wakeTime);
        if (doc.durationMin > 16 * 60) throw AppError.badRequest('That sleep is longer than 16 hours. Please check the times.');
        doc.day = data.night;
      }
      return repo.create(uid, path, doc);
    },

    async list(uid, { days = 30, type } = {}) {
      const docs = await repo.list(uid, path, { since: daysAgo(days).toISOString(), limit: 1000 });
      return type ? docs.filter((d) => d.type === type) : docs;
    },

    async remove(uid, id) {
      const ok = await repo.remove(uid, path, id);
      if (!ok) throw AppError.notFound('That entry no longer exists.');
    },
  };
}

module.exports = { createActivityService, sleepMinutes, ACTIVITY_TYPES };

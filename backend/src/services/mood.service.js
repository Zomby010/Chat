'use strict';

const AppError = require('../utils/AppError');
const { toDayKey, daysAgo } = require('../utils/dates');
const { assessRisk } = require('./crisis.service');
const { SUGGESTIONS } = require('../content/dailyContent');

/** Non-judgemental labels for the 1–5 scale. */
const MOOD_LABELS = { 1: 'Really struggling', 2: 'Low', 3: 'Okay', 4: 'Good', 5: 'Great' };

const byId = (id) => SUGGESTIONS.find((s) => s.id === id);

/**
 * Supportive next steps after a check-in, mapped to MindMate features.
 * Driven by how the person feels, never a judgement of the score.
 */
function suggestionsFor(score, emotions = []) {
  const e = new Set(emotions);
  const ids = [];
  if (e.has('anxious') || e.has('stressed') || e.has('overwhelmed')) ids.push('breathe', 'grounding');
  if (e.has('lonely')) ids.push('message-friend');
  if (e.has('tired')) ids.push('wake-time', 'screens-off');
  if (e.has('sad') || e.has('numb') || score <= 2) ids.push('plan-enjoy', 'walk-10');
  if (e.has('angry')) ids.push('walk-10', 'breathe');
  if (score >= 4) ids.push('thank-someone', 'plan-achieve');
  if (!ids.length) ids.push('walk-10', 'grounding');
  return [...new Set(ids)].slice(0, 3).map(byId).filter(Boolean);
}

function supportMessage(score) {
  if (score === 1) return "Thank you for checking in, especially on a hard day. You don't have to go through this alone. Talking to someone you trust, or to MindMate's companion, can help.";
  if (score === 2) return "It's okay to have low days. Be gentle with yourself, and try one small thing that usually helps a little.";
  if (score === 3) return 'Thanks for checking in. Okay days are a good time to do something small that looks after future you.';
  if (score === 4) return "Glad to hear it. Notice what's helping today, so you can come back to it.";
  return "That's wonderful. Savour it, and maybe share some of that energy with someone else.";
}

function createMoodService({ repo }) {
  const path = ['moods'];
  return {
    MOOD_LABELS,

    async create(uid, { score, emotions, note, tzOffset }) {
      const now = new Date();
      const safety = assessRisk(note || '');
      const entry = await repo.create(uid, path, {
        score,
        label: MOOD_LABELS[score],
        emotions,
        ...(note && { note }),
        day: toDayKey(now, tzOffset),
        createdAt: now.toISOString(),
        safetyLevel: safety.level,
      });
      return {
        entry,
        support: {
          message: supportMessage(score),
          suggestions: suggestionsFor(score, emotions),
          safety: { level: safety.level, showResources: safety.level === 'high' || safety.level === 'imminent' || score === 1 },
        },
      };
    },

    async list(uid, { days = 30 } = {}) {
      return repo.list(uid, path, { since: daysAgo(days).toISOString(), limit: 500 });
    },

    async latest(uid) {
      const [entry] = await repo.list(uid, path, { limit: 1 });
      return entry || null;
    },

    async remove(uid, id) {
      const ok = await repo.remove(uid, path, id);
      if (!ok) throw AppError.notFound('That check-in no longer exists.');
    },
  };
}

module.exports = { createMoodService, MOOD_LABELS, suggestionsFor };

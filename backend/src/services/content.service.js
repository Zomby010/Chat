'use strict';

const { QUOTES, JOKES, ENCOURAGEMENT, SUGGESTIONS } = require('../content/dailyContent');
const { toDayKey, hashString, daysAgo } = require('../utils/dates');

/**
 * Daily positivity: a quote, a joke, encouragement and a small suggestion.
 * Content is stable for a given user and day, and refreshable on request.
 * Encouragement adapts to recent check-ins, and the joke is held back on
 * hard days so humour never feels dismissive.
 */
function pick(list, seed) {
  return list[hashString(seed) % list.length];
}

function chooseTone(recentMoods) {
  if (!recentMoods.length) return 'general';
  const latest = recentMoods[0].score;
  const last3 = recentMoods.slice(0, 3).map((m) => m.score);
  const avg3 = last3.reduce((a, b) => a + b, 0) / last3.length;
  if (latest <= 2 || avg3 <= 2) return 'low';
  if (recentMoods.length >= 4) {
    const newer = recentMoods.slice(0, 3).reduce((a, m) => a + m.score, 0) / 3;
    const older = recentMoods.slice(3, 6).reduce((a, m) => a + m.score, 0) / Math.min(3, recentMoods.slice(3, 6).length);
    if (newer - older >= 0.7) return 'improving';
  }
  return 'general';
}

function createContentService({ repo, profileService }) {
  return {
    async daily(user, { tzOffset = 0, refresh = {} } = {}) {
      const day = toDayKey(new Date(), tzOffset);
      const [profile, recentMoods] = await Promise.all([
        profileService.getOrCreate(user),
        repo.list(user.uid, ['moods'], { since: daysAgo(10).toISOString(), limit: 10 }),
      ]);
      const seed = (kind) => `${user.uid}:${day}:${kind}:${refresh[kind] || 0}`;
      const tone = chooseTone(recentMoods);
      const struggling = recentMoods[0] && (recentMoods[0].score === 1 || ['high', 'imminent'].includes(recentMoods[0].safetyLevel));

      let joke = null;
      let jokeHiddenReason = null;
      if (!profile.preferences.showJokes) jokeHiddenReason = 'disabled';
      else if (struggling) jokeHiddenReason = 'gentle-day';
      else joke = pick(JOKES, seed('joke'));

      return {
        day,
        tone,
        quote: pick(QUOTES, seed('quote')),
        joke,
        jokeHiddenReason,
        encouragement: pick(ENCOURAGEMENT[tone], seed('encouragement')),
        suggestion: pick(SUGGESTIONS, seed('suggestion')),
      };
    },
  };
}

module.exports = { createContentService, chooseTone };

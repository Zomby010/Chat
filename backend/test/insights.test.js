'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { computeDashboard } = require('../src/services/insights.service');
const { DEFAULT_PREFERENCES } = require('../src/services/profile.service');
const { toDayKey, DAY_MS } = require('../src/utils/dates');

const now = new Date('2026-10-06T12:00:00Z');
const day = (n) => toDayKey(new Date(now.getTime() - n * DAY_MS));
const profile = { displayName: 'A', preferences: DEFAULT_PREFERENCES };

test('trend compares this week with last week', () => {
  const moods = [
    ...[0, 1, 2].map((n) => ({ day: day(n), score: 4 })),
    ...[8, 9, 10].map((n) => ({ day: day(n), score: 2 })),
  ];
  const d = computeDashboard({ moods, activities: [], plans: [], profile, now });
  assert.equal(d.mood.trend, 'up');
  assert.equal(d.mood.average7, 4);
  assert.equal(d.mood.streak, 3);
});

test('movement insight appears only with enough data and a real difference', () => {
  const moods = [];
  const activities = [];
  for (let n = 0; n < 8; n++) {
    const active = n % 2 === 0;
    moods.push({ day: day(n), score: active ? 4 : 3 });
    if (active) activities.push({ type: 'movement', day: day(n), minutes: 30, intensity: 'moderate' });
  }
  const d = computeDashboard({ moods, activities, plans: [], profile, now });
  assert.ok(d.insights.find((i) => i.id === 'movement-mood'));
  const none = computeDashboard({ moods: moods.slice(0, 2), activities, plans: [], profile, now });
  assert.equal(none.insights.length, 0);
});

test('vigorous minutes count double toward the WHO target', () => {
  const activities = [{ type: 'movement', day: day(0), minutes: 20, intensity: 'vigorous' }, { type: 'movement', day: day(1), minutes: 15, intensity: 'light' }];
  const d = computeDashboard({ moods: [], activities, plans: [], profile, now });
  assert.equal(d.movement.whoMinutesThisWeek, 40);
  assert.equal(d.movement.totalMinutesThisWeek, 35);
});

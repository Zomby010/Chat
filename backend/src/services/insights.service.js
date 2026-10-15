'use strict';

const { toDayKey, daysAgo, DAY_MS } = require('../utils/dates');

const round1 = (n) => (n === null || n === undefined || Number.isNaN(n) ? null : Math.round(n * 10) / 10);
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** Last n day keys, oldest first, ending today (in the client's timezone). */
function lastDays(n, tzOffset, now = new Date()) {
  return Array.from({ length: n }, (_, i) => toDayKey(new Date(now.getTime() - (n - 1 - i) * DAY_MS), tzOffset));
}

function nextDay(dayKey) {
  return new Date(new Date(`${dayKey}T00:00:00Z`).getTime() + DAY_MS).toISOString().slice(0, 10);
}

/**
 * Turns raw entries into meaningful, non-judgemental trends.
 * Pure function so it can be unit tested without a database.
 */
function computeDashboard({ moods, activities, plans, profile, tzOffset = 0, now = new Date() }) {
  const days30 = lastDays(30, tzOffset, now);
  const days7 = days30.slice(-7);
  const prev7 = days30.slice(-14, -7);
  const today = days30[days30.length - 1];
  const in7 = (d) => days7.includes(d);

  // ---- Mood ----
  const moodByDay = new Map();
  for (const m of moods) {
    if (!moodByDay.has(m.day)) moodByDay.set(m.day, []);
    moodByDay.get(m.day).push(m.score);
  }
  const dayAvg = (d) => avg(moodByDay.get(d) || []);
  const series = days30.map((day) => ({ day, average: round1(dayAvg(day)), count: (moodByDay.get(day) || []).length }));
  const scoresIn = (ds) => ds.flatMap((d) => moodByDay.get(d) || []);
  const average7 = avg(scoresIn(days7));
  const averagePrev7 = avg(scoresIn(prev7));
  let trend = null;
  if (average7 !== null && averagePrev7 !== null) {
    const diff = average7 - averagePrev7;
    trend = diff >= 0.4 ? 'up' : diff <= -0.4 ? 'down' : 'steady';
  }
  let streak = 0;
  for (let i = days30.length - 1; i >= 0; i--) {
    if (moodByDay.has(days30[i])) streak++;
    else if (i === days30.length - 1) continue; // today not checked in yet doesn't break the streak
    else break;
  }
  const emotionCounts = {};
  moods.filter((m) => days30.slice(-14).includes(m.day)).forEach((m) => (m.emotions || []).forEach((e) => (emotionCounts[e] = (emotionCounts[e] || 0) + 1)));
  const topEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([emotion, count]) => ({ emotion, count }));

  // ---- Activities ----
  const ofType = (t) => activities.filter((a) => a.type === t);
  const movement = ofType('movement');
  const moveMinsByDay = new Map();
  movement.forEach((a) => moveMinsByDay.set(a.day, (moveMinsByDay.get(a.day) || 0) + a.minutes));
  // WHO counts vigorous minutes double toward the moderate-intensity target.
  const whoMinutes = movement.filter((a) => in7(a.day)).reduce((s, a) => s + (a.intensity === 'vigorous' ? a.minutes * 2 : a.intensity === 'moderate' ? a.minutes : 0), 0);
  const totalMinutes7 = movement.filter((a) => in7(a.day)).reduce((s, a) => s + a.minutes, 0);

  const calm = activities.filter((a) => (a.type === 'mindfulness' || a.type === 'breathing') && in7(a.day));
  const connections = ofType('connection').filter((a) => in7(a.day));
  const sleep = ofType('sleep');
  const sleep7 = sleep.filter((s) => days30.slice(-8).includes(s.day));

  // ---- Plans ----
  const todays = plans.filter((p) => p.date === today);
  const done7 = plans.filter((p) => p.status === 'done' && in7(p.date));
  const lifts = plans.filter((p) => p.status === 'done' && p.moodBefore && p.moodAfter).map((p) => p.moodAfter - p.moodBefore);

  // ---- Observational insights (patterns, not proof) ----
  const insights = [];
  const compare = (predicate) => {
    const yes = [];
    const no = [];
    for (const [day, scores] of moodByDay) (predicate(day) ? yes : no).push(avg(scores));
    return yes.length >= 3 && no.length >= 3 ? { yes: avg(yes), no: avg(no) } : null;
  };
  const moveCmp = compare((d) => (moveMinsByDay.get(d) || 0) >= 20);
  if (moveCmp && moveCmp.yes - moveCmp.no >= 0.4) {
    insights.push({ id: 'movement-mood', feature: 'movement', text: `On days you moved for 20 minutes or more, your mood averaged ${round1(moveCmp.yes)} out of 5, compared with ${round1(moveCmp.no)} on other days.` });
  }
  const sleptWell = new Set(sleep.filter((s) => s.durationMin >= 7 * 60).map((s) => nextDay(s.day)));
  const sleptLess = new Set(sleep.filter((s) => s.durationMin < 7 * 60).map((s) => nextDay(s.day)));
  const sleepYes = [...moodByDay].filter(([d]) => sleptWell.has(d)).map(([, s]) => avg(s));
  const sleepNo = [...moodByDay].filter(([d]) => sleptLess.has(d)).map(([, s]) => avg(s));
  if (sleepYes.length >= 3 && sleepNo.length >= 3 && avg(sleepYes) - avg(sleepNo) >= 0.4) {
    insights.push({ id: 'sleep-mood', feature: 'sleep', text: `After nights with 7+ hours of sleep, your next-day mood averaged ${round1(avg(sleepYes))}, compared with ${round1(avg(sleepNo))} after shorter nights.` });
  }
  const connDays = new Set(ofType('connection').map((c) => c.day));
  const connCmp = compare((d) => connDays.has(d));
  if (connCmp && connCmp.yes - connCmp.no >= 0.4) {
    insights.push({ id: 'connection-mood', feature: 'connection', text: `Days when you connected with someone had an average mood of ${round1(connCmp.yes)}, compared with ${round1(connCmp.no)} on other days.` });
  }
  if (lifts.length >= 2 && avg(lifts) > 0) {
    insights.push({ id: 'plans-lift', feature: 'plans', text: `After finishing a planned activity, your mood rose by ${round1(avg(lifts))} points on average.` });
  }

  return {
    displayName: profile.displayName,
    today,
    mood: {
      latest: moods[0] || null,
      checkedInToday: moodByDay.has(today),
      average7: round1(average7),
      averagePrev7: round1(averagePrev7),
      trend,
      streak,
      checkInsThisWeek: scoresIn(days7).length,
      series,
      topEmotions,
    },
    movement: {
      whoMinutesThisWeek: whoMinutes,
      totalMinutesThisWeek: totalMinutes7,
      goal: profile.preferences.weeklyMovementGoal,
      activeDays: days7.filter((d) => (moveMinsByDay.get(d) || 0) > 0).length,
      byDay: days7.map((day) => ({ day, minutes: moveMinsByDay.get(day) || 0 })),
    },
    calm: {
      sessionsThisWeek: calm.length,
      minutesThisWeek: Math.round(calm.reduce((s, a) => s + a.durationSec, 0) / 60),
      breathingThisWeek: calm.filter((a) => a.type === 'breathing').length,
    },
    connection: { thisWeek: connections.length, daysThisWeek: new Set(connections.map((c) => c.day)).size },
    sleep: {
      nightsLogged: sleep7.length,
      averageHours: round1(avg(sleep7.map((s) => s.durationMin / 60))),
      averageQuality: round1(avg(sleep7.map((s) => s.quality))),
      goalHours: profile.preferences.sleepGoalHours,
    },
    plans: {
      today: todays,
      doneThisWeek: done7.length,
      upcoming: plans.filter((p) => p.status === 'planned' && p.date >= today).length,
      averageLift: lifts.length ? round1(avg(lifts)) : null,
    },
    insights,
  };
}

function createInsightsService({ repo, profileService }) {
  return {
    async dashboard(user, { tzOffset = 0 } = {}) {
      const since = daysAgo(31).toISOString();
      const [profile, moods, activities, plans] = await Promise.all([
        profileService.getOrCreate(user),
        repo.list(user.uid, ['moods'], { since, limit: 1000 }),
        repo.list(user.uid, ['activities'], { since, limit: 2000 }),
        repo.list(user.uid, ['plans'], { orderBy: 'date', direction: 'asc', since: toDayKey(daysAgo(31)), limit: 500 }),
      ]);
      return computeDashboard({ moods, activities, plans, profile, tzOffset });
    },
  };
}

module.exports = { createInsightsService, computeDashboard };

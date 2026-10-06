'use strict';

const DAY_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD in UTC, or in the offset (minutes) the client reports. */
function toDayKey(date, tzOffsetMinutes = 0) {
  const d = new Date(new Date(date).getTime() - tzOffsetMinutes * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function daysAgo(n, from = new Date()) {
  return new Date(from.getTime() - n * DAY_MS);
}

/** Deterministic integer from a string (FNV-1a), used to pick daily content. */
function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

module.exports = { DAY_MS, toDayKey, daysAgo, hashString };

/** Removes keys whose value is undefined (Firestore rejects them). */
function compact(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

module.exports.compact = compact;

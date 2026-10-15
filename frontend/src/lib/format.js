export const MOOD_LEVELS = [
  { score: 1, label: 'Really struggling', short: 'Struggling' },
  { score: 2, label: 'Low', short: 'Low' },
  { score: 3, label: 'Okay', short: 'Okay' },
  { score: 4, label: 'Good', short: 'Good' },
  { score: 5, label: 'Great', short: 'Great' },
];

export const EMOTIONS = [
  'calm', 'content', 'grateful', 'hopeful', 'motivated', 'proud',
  'tired', 'stressed', 'anxious', 'sad', 'lonely', 'angry', 'overwhelmed', 'numb',
];

export const moodLabel = (score) => MOOD_LEVELS.find((m) => m.score === Math.round(score))?.label ?? '';

export function todayKey(d = new Date()) {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function addDays(key, n) {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() + n);
  return todayKey(d);
}

export function formatDay(key, opts = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return new Date(`${key}T12:00:00`).toLocaleDateString(undefined, opts);
}

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(iso) {
  const d = new Date(iso);
  const today = todayKey();
  const key = todayKey(d);
  const time = formatTime(iso);
  if (key === today) return `Today, ${time}`;
  if (key === addDays(today, -1)) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}, ${time}`;
}

export function relativeDay(key) {
  const today = todayKey();
  if (key === today) return 'Today';
  if (key === addDays(today, -1)) return 'Yesterday';
  if (key === addDays(today, 1)) return 'Tomorrow';
  return formatDay(key);
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return 'Hello';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export const capitalise = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export function minutesToHours(mins) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

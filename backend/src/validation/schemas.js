'use strict';

const { z } = require('zod');

const trimmed = (max) => z.string().trim().max(max);
const optionalText = (max) => trimmed(max).optional().transform((v) => (v ? v : undefined));
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD.');
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour time, e.g. 23:15.');

const EMOTIONS = [
  'calm', 'content', 'grateful', 'hopeful', 'motivated', 'proud',
  'tired', 'stressed', 'anxious', 'sad', 'lonely', 'angry', 'overwhelmed', 'numb',
];

const REGION = z.string().trim().toUpperCase().regex(/^[A-Z]{2,4}$/, 'Unknown region.');

// ---------- Profile ----------
const profileUpdate = z
  .object({
    displayName: trimmed(60).min(1, 'Please enter a name.').optional(),
    region: REGION.optional(),
    preferences: z
      .object({
        shareMoodWithAI: z.boolean().optional(),
        shareNameWithAI: z.boolean().optional(),
        weeklyMovementGoal: z.number().int().min(10).max(1000).optional(),
        sleepGoalHours: z.number().min(4).max(12).optional(),
        showJokes: z.boolean().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

// ---------- Mood ----------
const moodCreate = z
  .object({
    score: z.number().int().min(1).max(5),
    emotions: z.array(z.enum(EMOTIONS)).max(6).default([]),
    note: optionalText(1000),
    tzOffset: z.number().int().min(-840).max(840).default(0),
  })
  .strict();

const rangeQuery = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
  type: z.string().optional(),
  tzOffset: z.coerce.number().int().min(-840).max(840).default(0),
});

// ---------- Activities (one collection, discriminated by type) ----------
const activityCreate = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('breathing'),
    pattern: z.enum(['calm', 'box', '478']),
    durationSec: z.number().int().min(10).max(3600),
    tzOffset: z.number().int().default(0),
  }).strict(),
  z.object({
    type: z.literal('mindfulness'),
    session: z.enum(['grounding', 'body-scan', 'mindful-minute', 'kindness']),
    durationSec: z.number().int().min(10).max(7200),
    tzOffset: z.number().int().default(0),
  }).strict(),
  z.object({
    type: z.literal('movement'),
    kind: z.enum(['walk', 'run', 'cycle', 'sport', 'dance', 'strength', 'yoga', 'chores', 'other']),
    minutes: z.number().int().min(1).max(600),
    intensity: z.enum(['light', 'moderate', 'vigorous']),
    tzOffset: z.number().int().default(0),
  }).strict(),
  z.object({
    type: z.literal('connection'),
    kind: z.enum(['message', 'call', 'video', 'in-person', 'group', 'helped-someone']),
    with: z.enum(['friend', 'family', 'partner', 'classmate', 'colleague', 'community', 'other']),
    feltAfter: z.number().int().min(1).max(5).optional(),
    tzOffset: z.number().int().default(0),
  }).strict(),
  z.object({
    type: z.literal('sleep'),
    night: isoDate,
    bedTime: hhmm,
    wakeTime: hhmm,
    quality: z.number().int().min(1).max(5),
    windDown: z.boolean().default(false),
    screensOff: z.boolean().default(false),
    tzOffset: z.number().int().default(0),
  }).strict(),
]);

// ---------- Behavioural activation plans ----------
const planCreate = z
  .object({
    title: trimmed(120).min(2, 'Give your plan a short title.'),
    category: z.enum(['enjoyment', 'achievement', 'connection', 'movement', 'self-care']),
    date: isoDate,
    moodBefore: z.number().int().min(1).max(5).optional(),
  })
  .strict();

const planUpdate = z
  .object({
    title: trimmed(120).min(2).optional(),
    date: isoDate.optional(),
    status: z.enum(['planned', 'done', 'skipped']).optional(),
    moodBefore: z.number().int().min(1).max(5).optional(),
    moodAfter: z.number().int().min(1).max(5).optional(),
    reflection: optionalText(500),
  })
  .strict();

// ---------- Chat ----------
const chatMessage = z
  .object({
    text: trimmed(2000).min(1, 'Type a message first.'),
  })
  .strict();

const chatSessionCreate = z.object({ title: optionalText(80) }).strict();

module.exports = {
  EMOTIONS,
  profileUpdate,
  moodCreate,
  rangeQuery,
  activityCreate,
  planCreate,
  planUpdate,
  chatMessage,
  chatSessionCreate,
};

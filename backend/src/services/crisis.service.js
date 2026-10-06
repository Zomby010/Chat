'use strict';

/**
 * Crisis detection.
 *
 * A deterministic, rule-based classifier that runs on every chat message,
 * mood note and plan BEFORE any AI is involved. It never depends on the AI
 * provider being available, so safety behaviour is predictable and testable.
 *
 * Levels (highest wins):
 *   imminent - stated plan, intent, means or an attempt in progress
 *   high     - suicidal thoughts, self-harm, or being harmed / unsafe
 *   concern  - hopelessness or feeling like a burden, without explicit risk
 *   none
 *
 * Keyword systems produce false positives and false negatives. MindMate errs
 * towards showing resources: offering a helpline to someone who did not need
 * it costs little; missing someone who did costs a great deal.
 */
const crisisData = require('../../../shared/crisisResources.json');

const LEVELS = ['none', 'concern', 'high', 'imminent'];

// Each rule: [regex, category]. Text is lower-cased and apostrophes normalised first.
const IMMINENT = [
  [/\b(going to|gonna|about to|plan(ning)? to|decided to|ready to)\s+(kill myself|end (it|my life|things)|take my (own )?life|die tonight|jump)\b/, 'suicide-plan'],
  [/\b(kill myself|end my life|take my (own )?life)\s+(tonight|today|now|this (evening|morning|weekend))\b/, 'suicide-plan'],
  [/\b(took|swallowed|taken)\s+(a lot of|all (of )?my|too many|loads of|a bunch of|\d+)\s+(pills|tablets|meds|medication)\b/, 'overdose'],
  [/\b(have|got|bought)\s+(the )?(pills|rope|gun|a gun|knife|blade)\s+(ready|to (do it|end it|kill myself))\b/, 'means'],
  [/\b(this is (my )?goodbye|writing (my|a) (suicide|goodbye) note|wrote (my|a) (suicide|goodbye) note)\b/, 'goodbye'],
  [/\b(i am|im) (standing|sitting) on (the|a) (edge|bridge|roof|ledge)\b/, 'suicide-plan'],
];

const HIGH = [
  [/\b(suicid(e|al)|kill myself|killing myself|end my life|ending my life|take my (own )?life|want to die|wanna die|wish i (was|were) dead|better off dead|don ?t want to (be alive|live|exist|wake up)|no reason to live)\b/, 'suicidal-thoughts'],
  [/\b(hurt(ing)? myself|harm(ing)? myself|self[- ]?harm|cut(ting)? myself|burn(ing)? myself)\b/, 'self-harm'],
  [/\b(he|she|they|someone|my (partner|husband|wife|boyfriend|girlfriend|dad|father|mum|mom|mother|parent|uncle|step\w*))\s+(hits|beats|abuses|hurts|raped|rapes|touches) me\b/, 'abuse'],
  [/\b(i am|im|i feel) (not safe|unsafe) (at home|here|with (him|her|them))\b/, 'unsafe'],
  [/\b(want to|going to|gonna) (kill|hurt) (him|her|them|someone|people)\b/, 'harm-to-others'],
];

const CONCERN = [
  [/\b(no point (in )?(living|anything|going on|trying)|can ?t go on|cant take (it|this) anymore|can ?t do this anymore|give up on (everything|life))\b/, 'hopelessness'],
  [/\b(hopeless|worthless|i am a burden|im a burden|everyone would be better (off )?without me|nobody would (care|notice|miss me))\b/, 'hopelessness'],
  [/\b(want to disappear|wish i could disappear|want it (all )?to stop|want to sleep forever)\b/, 'passive-ideation'],
];

// Phrases that explicitly negate risk. They lower a match by one level only
// when no other rule fires, and never lower "imminent".
const NEGATIONS = [
  /\b(not|never|wouldn ?t|would never|don ?t|do not)\s+(be\s+)?(suicidal|want to die|kill myself|hurt myself|harm myself)\b/,
  /\b(i am|im) not (going to|gonna) (hurt|kill) myself\b/,
];

function normalise(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/'/g, '')
    .replace(/\s+/g, ' ');
}

function matchRules(text, rules) {
  return rules.filter(([re]) => re.test(text)).map(([, category]) => category);
}

/**
 * @param {string} text
 * @returns {{ level: 'none'|'concern'|'high'|'imminent', categories: string[] }}
 */
function assessRisk(text) {
  const t = normalise(text);
  if (!t.trim()) return { level: 'none', categories: [] };

  const imminent = matchRules(t, IMMINENT);
  if (imminent.length) return { level: 'imminent', categories: [...new Set(imminent)] };

  const high = matchRules(t, HIGH);
  const concern = matchRules(t, CONCERN);
  const negated = NEGATIONS.some((re) => re.test(t));

  if (high.length) {
    // "I'm not suicidal, just tired" should not trigger a full crisis response,
    // but we still treat it as worth a gentle check-in.
    const onlyNegatedSuicide = negated && high.every((c) => c === 'suicidal-thoughts' || c === 'self-harm');
    if (onlyNegatedSuicide) return { level: 'concern', categories: ['negated-risk-mention'] };
    return { level: 'high', categories: [...new Set([...high, ...concern])] };
  }
  if (concern.length) return { level: 'concern', categories: [...new Set(concern)] };
  return { level: 'none', categories: [] };
}

function maxLevel(a, b) {
  return LEVELS.indexOf(a) >= LEVELS.indexOf(b) ? a : b;
}

function getRegion(code) {
  const key = String(code || '').toUpperCase();
  return crisisData.regions[key] ? key : 'INTL';
}

function getResources(regionCode) {
  const code = getRegion(regionCode);
  return { code, ...crisisData.regions[code], lastVerified: crisisData._meta.lastVerified };
}

function listRegions() {
  return Object.entries(crisisData.regions).map(([code, r]) => ({ code, name: r.name }));
}

function formatContact(r) {
  if (r.display) return r.display;
  if (r.phone) return r.phone;
  if (r.url) return r.url;
  return '';
}

/**
 * The fixed response used for imminent risk, and as the fallback whenever the
 * AI cannot answer a high-risk message. Written to be calm, direct and short.
 */
function buildCrisisMessage(level, regionCode) {
  const region = getResources(regionCode);
  const emergency = region.emergency.phone
    ? `call ${region.emergency.phone} now`
    : 'call your local emergency number now';
  const lines = region.resources.slice(0, 2).map((r) => `• ${r.name}: ${formatContact(r)}${r.hours ? ` (${r.hours})` : ''}`);

  if (level === 'imminent') {
    return [
      "I'm really glad you told me. What you're describing sounds like you might be in danger right now, and you deserve immediate support from a real person.",
      `If you have taken something or could act on these thoughts, please ${emergency} or go to the nearest emergency department.`,
      'You can also reach someone who is trained to help:',
      ...lines,
      "If you can, move away from anything you could use to hurt yourself and stay with someone you trust. I'm still here with you while you reach out.",
    ].join('\n');
  }

  return [
    "Thank you for trusting me with something this heavy. I'm an AI, so I can't keep you safe the way a person can, but you don't have to carry this alone.",
    'Please consider talking to someone right now:',
    ...lines,
    `If you feel you might act on these thoughts, ${emergency}.`,
    "Would you like to tell me a little more about what's happening? I'm listening.",
  ].join('\n');
}

module.exports = {
  LEVELS,
  assessRisk,
  maxLevel,
  getResources,
  listRegions,
  getRegion,
  buildCrisisMessage,
};

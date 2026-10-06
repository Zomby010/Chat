'use strict';

/**
 * Post-processing safety checks on AI output.
 * The system prompt asks the model to follow these rules; this guard enforces
 * the most important ones in code, because prompts alone are not a guarantee.
 */
const RULES = [
  {
    id: 'dosage',
    // "take 50 mg", "2 tablets of", "increase your dose"
    re: /\b(\d+(\.\d+)?\s?(mg|milligrams?|mcg)\b|\b(increase|decrease|double|stop|change) (your|the) (dose|dosage|medication|meds)\b|\btake \d+ (pills|tablets|capsules)\b)/i,
  },
  {
    id: 'professional-claim',
    re: /\b(as (a|your) (doctor|psychologist|psychiatrist|therapist|counsell?or)|i am (a|your) (licensed |qualified )?(doctor|psychologist|psychiatrist|therapist|counsell?or))\b/i,
  },
  {
    id: 'diagnosis',
    re: /\b(you (have|are suffering from|definitely have|clearly have|probably have) (clinical )?(depression|bipolar|ptsd|bpd|ocd|adhd|schizophrenia|an anxiety disorder|a personality disorder))\b/i,
  },
];

const SAFE_REPLACEMENT =
  "I want to be careful here: I'm an AI companion, not a medical professional, so I can't diagnose conditions or advise on medication. A doctor, pharmacist or counsellor is the right person for that question. I'm happy to keep talking about how you're feeling, or we could try one of the calming exercises together.";

function guardOutput(text) {
  const violations = RULES.filter((r) => r.re.test(text)).map((r) => r.id);
  if (!violations.length) return { text, violations };
  return { text: SAFE_REPLACEMENT, violations };
}

module.exports = { guardOutput, SAFE_REPLACEMENT };

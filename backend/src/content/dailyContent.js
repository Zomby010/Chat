'use strict';

/**
 * Curated daily content.
 * Quotes were chosen only where the attribution is well documented; the
 * source is shown with each one. Jokes are clean, gentle wordplay that does
 * not touch on mental illness. Encouragement is written for MindMate.
 */
const QUOTES = [
  { text: 'The best way out is always through.', author: 'Robert Frost', source: 'A Servant to Servants (1914)' },
  { text: 'Hope is the thing with feathers that perches in the soul.', author: 'Emily Dickinson', source: 'Poem 254' },
  { text: "I'm not afraid of storms, for I'm learning how to sail my ship.", author: 'Louisa May Alcott', source: 'Little Women (1868)' },
  { text: 'Although the world is full of suffering, it is full also of the overcoming of it.', author: 'Helen Keller', source: 'Optimism (1903)' },
  { text: 'The sun himself is weak when he first rises, and gathers strength and courage as the day gets on.', author: 'Charles Dickens', source: 'The Old Curiosity Shop (1841)' },
  { text: 'Rest is not idleness, and to lie sometimes on the grass under trees on a summer’s day, listening to the murmur of the water, or watching the clouds float across the sky, is by no means a waste of time.', author: 'John Lubbock', source: 'The Use of Life (1894)' },
  { text: 'Almost everything will work again if you unplug it for a few minutes, including you.', author: 'Anne Lamott', source: 'TED talk, 2017' },
  { text: 'There is a crack in everything. That’s how the light gets in.', author: 'Leonard Cohen', source: 'Anthem (1992)' },
  { text: 'Nothing in life is to be feared, it is only to be understood.', author: 'Marie Curie', source: 'attributed' },
  { text: 'In the middle of winter I at last discovered that there was in me an invincible summer.', author: 'Albert Camus', source: 'Return to Tipasa (1952)' },
  { text: 'Owning our story and loving ourselves through that process is the bravest thing we’ll ever do.', author: 'Brené Brown', source: 'The Gifts of Imperfection (2010)' },
  { text: 'You are braver than you believe, stronger than you seem, and smarter than you think.', author: 'Christopher Robin', source: "Pooh's Grand Adventure (1997)" },
];

const JOKES = [
  { setup: 'Why did the scarecrow win an award?', punchline: 'Because he was outstanding in his field.' },
  { setup: 'What do you call a bear with no teeth?', punchline: 'A gummy bear.' },
  { setup: 'Why don’t eggs tell jokes?', punchline: 'They’d crack each other up.' },
  { setup: 'What did the ocean say to the beach?', punchline: 'Nothing, it just waved.' },
  { setup: 'Why did the bicycle fall over?', punchline: 'It was two tired.' },
  { setup: 'What do you call a sleeping dinosaur?', punchline: 'A dino-snore.' },
  { setup: 'Why are elevator jokes so good?', punchline: 'They work on many levels.' },
  { setup: 'What do you call a cow with no legs?', punchline: 'Ground beef.' },
  { setup: 'Why did the math book look worried?', punchline: 'It had too many problems. (It’s okay, we can work through them one at a time.)' },
  { setup: 'How does the moon cut its hair?', punchline: 'Eclipse it.' },
  { setup: 'What do you call a fish wearing a bowtie?', punchline: 'Sofishticated.' },
  { setup: 'Why did the cookie go to the doctor?', punchline: 'It was feeling crummy.' },
  { setup: 'Why can’t you trust stairs?', punchline: 'They’re always up to something.' },
  { setup: 'Why did the tomato blush?', punchline: 'It saw the salad dressing.' },
];

const ENCOURAGEMENT = {
  general: [
    'Small steps still move you forward. One kind thing for yourself today is enough.',
    'You don’t have to have it all figured out to take care of yourself today.',
    'Checking in with yourself is a skill, and you’re practising it right now.',
    'Your feelings make sense, even the confusing ones. You’re allowed to take things slowly.',
    'Progress isn’t a straight line. Showing up, even on the hard days, counts.',
    'Rest is part of the work, not a break from it.',
    'You are worth the same care you would give a good friend.',
  ],
  low: [
    'It sounds like things have felt heavy lately. You don’t have to fix everything today; just get through the next small moment.',
    'Hard days don’t erase the good ones, and they don’t last forever. Be gentle with yourself.',
    'Reaching out, even with a short message, can lighten the load. You deserve support.',
    'When everything feels like too much, start tiny: a glass of water, a few slow breaths, a step outside.',
  ],
  improving: [
    'Your recent check-ins look a little brighter. Notice what has been helping, and keep a little of it in your day.',
    'Something is working. It’s worth celebrating, even quietly.',
  ],
};

/**
 * Wellness suggestions, each linked to a MindMate feature and the evidence
 * area it draws on (see docs/EVIDENCE.md).
 */
const SUGGESTIONS = [
  { id: 'walk-10', text: 'Take a 10-minute walk, outside if you can.', feature: 'movement', route: '/wellbeing/movement', evidence: 'physical-activity' },
  { id: 'stretch-5', text: 'Stand up and stretch for five minutes between tasks.', feature: 'movement', route: '/wellbeing/movement', evidence: 'physical-activity' },
  { id: 'message-friend', text: 'Send a short message to someone you haven’t spoken to in a while.', feature: 'connection', route: '/wellbeing/connection', evidence: 'social-connection' },
  { id: 'thank-someone', text: 'Thank someone for something small they did.', feature: 'connection', route: '/wellbeing/connection', evidence: 'social-connection' },
  { id: 'grounding', text: 'Try the 5-4-3-2-1 grounding exercise (about 3 minutes).', feature: 'mindfulness', route: '/wellbeing/mindfulness', evidence: 'mindfulness' },
  { id: 'breathe', text: 'Do one minute of slow breathing before your next meal.', feature: 'breathing', route: '/wellbeing/breathing', evidence: 'mindfulness' },
  { id: 'wake-time', text: 'Pick a wake-up time for tomorrow and keep it, even if you sleep badly.', feature: 'sleep', route: '/wellbeing/sleep', evidence: 'sleep' },
  { id: 'screens-off', text: 'Put your phone away 30 minutes before bed tonight.', feature: 'sleep', route: '/wellbeing/sleep', evidence: 'sleep' },
  { id: 'plan-enjoy', text: 'Plan one small thing you usually enjoy, and put it in your day.', feature: 'plans', route: '/wellbeing/plans', evidence: 'behavioural-activation' },
  { id: 'plan-achieve', text: 'Pick one small task you’ve been putting off and do just the first step.', feature: 'plans', route: '/wellbeing/plans', evidence: 'behavioural-activation' },
];

module.exports = { QUOTES, JOKES, ENCOURAGEMENT, SUGGESTIONS };

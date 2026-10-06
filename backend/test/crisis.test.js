'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { assessRisk, buildCrisisMessage, getResources } = require('../src/services/crisis.service');

const cases = [
  ['I had a nice walk today', 'none'],
  ['This exam is killing me lol', 'none'],
  ['I feel hopeless and like a burden to everyone', 'concern'],
  ["I can't go on like this", 'concern'],
  ["I'm not suicidal, just exhausted", 'concern'],
  ['I want to die', 'high'],
  ['Sometimes I think about suicide', 'high'],
  ['I have been cutting myself again', 'high'],
  ['My dad hits me when he drinks', 'high'],
  ["I'm going to kill myself tonight", 'imminent'],
  ['I took a lot of pills an hour ago', 'imminent'],
  ['I wrote my goodbye note', 'imminent'],
  ['I’m standing on the bridge', 'imminent'],
];

for (const [text, expected] of cases) {
  test(`assessRisk: "${text}" -> ${expected}`, () => {
    assert.equal(assessRisk(text).level, expected);
  });
}

test('empty text is none', () => {
  assert.deepEqual(assessRisk(''), { level: 'none', categories: [] });
});

test('crisis message includes regional emergency number and helpline', () => {
  const msg = buildCrisisMessage('imminent', 'KE');
  assert.match(msg, /999/);
  assert.match(msg, /1199/);
});

test('unknown region falls back to international resources', () => {
  assert.equal(getResources('ZZ').code, 'INTL');
  assert.match(buildCrisisMessage('high', 'ZZ'), /local emergency number/);
});

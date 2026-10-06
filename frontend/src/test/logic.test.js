import { describe, expect, it } from 'vitest';
import { phaseAt } from '../pages/wellbeing/Breathing';
import { sleepMinutes } from '../pages/wellbeing/Sleep';
import { whoMinutes } from '../pages/wellbeing/Movement';
import { passwordChecks, validateSignup } from '../pages/auth/Signup';
import { addDays, moodLabel, todayKey } from '../lib/format';
import { getRegionResources, smsHref, telHref } from '../lib/region';
import { fieldErrors } from '../lib/api';

describe('breathing pacer', () => {
  it('walks through the calm pattern phases and loops', () => {
    expect(phaseAt('calm', 0).label).toBe('Breathe in');
    expect(phaseAt('calm', 4.1).label).toBe('Hold');
    expect(phaseAt('calm', 6.5).label).toBe('Breathe out');
    expect(phaseAt('calm', 12).label).toBe('Breathe in');
    expect(phaseAt('box', 13).remaining).toBe(3);
  });
});

describe('sleep diary', () => {
  it('handles nights that cross midnight', () => {
    expect(sleepMinutes('23:00', '07:00')).toBe(480);
    expect(sleepMinutes('01:30', '08:00')).toBe(390);
    expect(sleepMinutes('22:15', '22:15')).toBe(1440);
  });
});

describe('movement minutes', () => {
  it('counts vigorous minutes double and light as zero toward the WHO target', () => {
    expect(whoMinutes({ minutes: 30, intensity: 'moderate' })).toBe(30);
    expect(whoMinutes({ minutes: 30, intensity: 'vigorous' })).toBe(60);
    expect(whoMinutes({ minutes: 30, intensity: 'light' })).toBe(0);
  });
});

describe('sign-up validation', () => {
  const good = { name: 'Amina', email: 'amina@example.com', password: 'calm2day', confirm: 'calm2day', agree: true };
  it('accepts a valid form', () => {
    expect(validateSignup(good)).toEqual({});
  });
  it('explains each problem', () => {
    const errs = validateSignup({ name: 'A', email: 'nope', password: 'short', confirm: 'x', agree: false });
    expect(Object.keys(errs).sort()).toEqual(['agree', 'confirm', 'email', 'name', 'password']);
  });
  it('requires a letter and a number', () => {
    expect(passwordChecks('12345678').every((c) => c.ok)).toBe(false);
    expect(passwordChecks('abcdefgh').every((c) => c.ok)).toBe(false);
  });
});

describe('formatting helpers', () => {
  it('labels moods kindly', () => {
    expect(moodLabel(1)).toBe('Really struggling');
    expect(moodLabel(4.4)).toBe('Good');
  });
  it('moves day keys across month ends', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(todayKey(new Date(2026, 4, 9, 12))).toBe('2026-05-09');
  });
});

describe('crisis resources', () => {
  it('falls back to international resources for unknown regions', () => {
    expect(getRegionResources('ZZ').code).toBe('INTL');
    expect(getRegionResources('ke').emergency.phone).toBe('999');
  });
  it('builds tap-to-call and tap-to-text links', () => {
    expect(telHref('+254 722 178 177')).toBe('tel:+254722178177');
    expect(smsHref('85258', 'SHOUT')).toBe('sms:85258?&body=SHOUT');
  });
});

describe('API field errors', () => {
  it('maps validation details to fields', () => {
    expect(fieldErrors({ details: { fields: [{ field: 'title', message: 'Too short' }] } })).toEqual({ title: 'Too short' });
    expect(fieldErrors(new Error('x'))).toEqual({});
  });
});

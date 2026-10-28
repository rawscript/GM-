import { describe, expect, it } from 'vitest';
import { baselineDeviation, idempotencyKey, triageTier } from '../src/domain/triage.js';

describe('triage and summary helpers', () => {
  it('returns distinct referral tiers from documented rule inputs', () => {
    expect(triageTier({ measurementAvailable: true, exposureFlags: [], ruleTriggered: false })).toBe('green');
    expect(triageTier({ measurementAvailable: true, exposureFlags: ['reported'], ruleTriggered: false })).toBe('amber');
    expect(triageTier({ measurementAvailable: true, exposureFlags: [], ruleTriggered: 'urgent' })).toBe('red');
  });

  it('returns a deviation from a personal baseline without classifying fever', () => {
    expect(baselineDeviation(36.8, 36.2)).toBe(0.6);
    expect(baselineDeviation(Number.NaN, 36.2)).toBeNull();
  });

  it('creates a stable message key from notification identity', () => {
    expect(idempotencyKey('GM-1', '2026-10-28T09:00:00Z', 'fever flag')).toBe('gm-1:2026-10-28t09:00:00z:feverflag');
  });
});

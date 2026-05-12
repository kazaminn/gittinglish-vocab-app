import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateSM2, qualityFromCorrectness } from '../../src/lib/sm2';

const DAY_MS = 86_400_000;
const FAKE_NOW = 1_700_000_000_000; // fixed timestamp in ms

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FAKE_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('calculateSM2', () => {
  it('first correct answer yields interval=1, reps=1', () => {
    const result = calculateSM2({
      quality: 4,
      ease: 2.5,
      interval: 0,
      reps: 0,
    });
    expect(result.interval).toBe(1);
    expect(result.reps).toBe(1);
    expect(result.nextReview).toBe(FAKE_NOW + DAY_MS);
  });

  it('second correct answer yields interval=6, reps=2', () => {
    const result = calculateSM2({
      quality: 4,
      ease: 2.5,
      interval: 1,
      reps: 1,
    });
    expect(result.interval).toBe(6);
    expect(result.reps).toBe(2);
  });

  it('third and later answers use interval = round(prev * ease)', () => {
    const result = calculateSM2({
      quality: 4,
      ease: 2.5,
      interval: 6,
      reps: 2,
    });
    expect(result.interval).toBe(15); // round(6 * 2.5)
    expect(result.reps).toBe(3);
  });

  it('incorrect answer resets interval to 1 and reps to 0', () => {
    const result = calculateSM2({
      quality: 1,
      ease: 2.5,
      interval: 15,
      reps: 5,
    });
    expect(result.interval).toBe(1);
    expect(result.reps).toBe(0);
  });

  it('ease never drops below 1.3', () => {
    const result = calculateSM2({
      quality: 0,
      ease: 1.3,
      interval: 1,
      reps: 0,
    });
    expect(result.ease).toBe(1.3);
  });

  it('quality=5 increases ease', () => {
    const result = calculateSM2({
      quality: 5,
      ease: 2.5,
      interval: 1,
      reps: 1,
    });
    expect(result.ease).toBeGreaterThan(2.5);
  });

  it('quality=3 (boundary) counts as correct', () => {
    const result = calculateSM2({
      quality: 3,
      ease: 2.5,
      interval: 0,
      reps: 0,
    });
    expect(result.reps).toBe(1);
    expect(result.interval).toBe(1);
  });

  it('quality=2 (boundary) counts as incorrect', () => {
    const result = calculateSM2({
      quality: 2,
      ease: 2.5,
      interval: 6,
      reps: 3,
    });
    expect(result.reps).toBe(0);
    expect(result.interval).toBe(1);
  });

  it('nextReview = Date.now() + interval * DAY_MS (in ms)', () => {
    const result = calculateSM2({
      quality: 4,
      ease: 2.5,
      interval: 6,
      reps: 2,
    });
    expect(result.nextReview).toBe(FAKE_NOW + result.interval * DAY_MS);
  });

  it('ease is rounded to two decimal places', () => {
    const result = calculateSM2({
      quality: 4,
      ease: 2.5,
      interval: 1,
      reps: 1,
    });
    const decimals = result.ease.toString().split('.')[1];
    expect(!decimals || decimals.length <= 2).toBe(true);
  });
});

describe('qualityFromCorrectness', () => {
  it('correct → 4', () => {
    expect(qualityFromCorrectness(true)).toBe(4);
  });

  it('incorrect → 1', () => {
    expect(qualityFromCorrectness(false)).toBe(1);
  });
});

import { describe, it, expect } from 'vitest';
import { calculateSM2, qualityFromCorrectness } from '../sm2.js';

const NOW = 1700000000;
const DAY = 86400;

describe('calculateSM2', () => {
  describe('first review (reps=0)', () => {
    it('correct: interval becomes 1, reps becomes 1', () => {
      const result = calculateSM2(
        { quality: 4, ease: 2.5, interval: 1, reps: 0 },
        NOW
      );
      expect(result.interval).toBe(1);
      expect(result.reps).toBe(1);
      expect(result.nextReview).toBe(NOW + 1 * DAY);
    });

    it('incorrect: interval stays 1, reps stays 0', () => {
      const result = calculateSM2(
        { quality: 1, ease: 2.5, interval: 1, reps: 0 },
        NOW
      );
      expect(result.interval).toBe(1);
      expect(result.reps).toBe(0);
    });
  });

  describe('second review (reps=1)', () => {
    it('correct: interval becomes 6', () => {
      const result = calculateSM2(
        { quality: 4, ease: 2.5, interval: 1, reps: 1 },
        NOW
      );
      expect(result.interval).toBe(6);
      expect(result.reps).toBe(2);
      expect(result.nextReview).toBe(NOW + 6 * DAY);
    });
  });

  describe('nth review (reps>=2)', () => {
    it('correct: interval = round(interval * ease)', () => {
      const result = calculateSM2(
        { quality: 4, ease: 2.5, interval: 6, reps: 2 },
        NOW
      );
      expect(result.interval).toBe(15); // round(6 * 2.5) = 15
      expect(result.reps).toBe(3);
    });

    it('incorrect: resets reps to 0, interval to 1', () => {
      const result = calculateSM2(
        { quality: 1, ease: 2.5, interval: 15, reps: 3 },
        NOW
      );
      expect(result.interval).toBe(1);
      expect(result.reps).toBe(0);
    });
  });

  describe('ease calculation', () => {
    it('ease never drops below 1.3', () => {
      // Multiple failures
      let ease = 2.5;
      for (let i = 0; i < 20; i++) {
        const result = calculateSM2(
          { quality: 0, ease, interval: 1, reps: 0 },
          NOW
        );
        ease = result.ease;
      }
      expect(ease).toBeGreaterThanOrEqual(1.3);
    });

    it('quality 5 increases ease', () => {
      const result = calculateSM2(
        { quality: 5, ease: 2.5, interval: 1, reps: 0 },
        NOW
      );
      expect(result.ease).toBeGreaterThan(2.5);
    });

    it('quality 4 maintains ease roughly', () => {
      const result = calculateSM2(
        { quality: 4, ease: 2.5, interval: 1, reps: 0 },
        NOW
      );
      // q=4: 0.1 - (1) * (0.08 + 1 * 0.02) = 0.1 - 0.1 = 0
      expect(result.ease).toBe(2.5);
    });

    it('quality 1 decreases ease', () => {
      const result = calculateSM2(
        { quality: 1, ease: 2.5, interval: 1, reps: 0 },
        NOW
      );
      expect(result.ease).toBeLessThan(2.5);
    });
  });

  describe('all quality values', () => {
    for (const q of [0, 1, 2, 3, 4, 5] as const) {
      it(`quality ${q} produces valid output`, () => {
        const result = calculateSM2(
          { quality: q, ease: 2.5, interval: 6, reps: 2 },
          NOW
        );
        expect(result.ease).toBeGreaterThanOrEqual(1.3);
        expect(result.interval).toBeGreaterThanOrEqual(1);
        expect(result.nextReview).toBeGreaterThan(NOW);
        expect(result.reps).toBeGreaterThanOrEqual(0);
      });
    }
  });
});

describe('qualityFromCorrectness', () => {
  it('correct returns 4', () => {
    expect(qualityFromCorrectness(true)).toBe(4);
  });
  it('incorrect returns 1', () => {
    expect(qualityFromCorrectness(false)).toBe(1);
  });
});

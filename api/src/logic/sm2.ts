import type { Quality } from '@gittinglish-vocab-app/shared';

export interface SM2Input {
  quality: Quality;
  ease: number;
  interval: number;
  reps: number;
}

export interface SM2Output {
  ease: number;
  interval: number;
  reps: number;
  nextReview: number;
}

const DAY_SECONDS = 86400;
const MIN_EASE = 1.3;

export function calculateSM2(input: SM2Input, now: number): SM2Output {
  const { quality, ease, interval, reps } = input;

  let newEase: number;
  let newInterval: number;
  let newReps: number;

  if (quality >= 3) {
    // Success
    if (reps === 0) {
      newInterval = 1;
    } else if (reps === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * ease);
    }
    newReps = reps + 1;
  } else {
    // Failure — reset but be gentle
    newInterval = 1;
    newReps = 0;
  }

  // Update ease factor
  newEase = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEase = Math.max(MIN_EASE, newEase);

  const nextReview = now + newInterval * DAY_SECONDS;

  return {
    ease: Math.round(newEase * 100) / 100,
    interval: newInterval,
    reps: newReps,
    nextReview,
  };
}

/** MVP simplification: correct = 4, incorrect = 1 */
export function qualityFromCorrectness(isCorrect: boolean): Quality {
  return isCorrect ? 4 : 1;
}

import { describe, expect, it } from 'vitest';
import { normalizeAnswer } from '../../src/lib/normalize';

describe('answer judging logic', () => {
  describe('normalized answer matching (word_input / sentence_input)', () => {
    it('matches case-insensitively', () => {
      const accepted = ['add'];
      const userInput = 'Add';
      const normalized = normalizeAnswer(userInput);
      const isCorrect = accepted.some((a) => normalizeAnswer(a) === normalized);
      expect(isCorrect).toBe(true);
    });

    it('matches with trailing punctuation stripped', () => {
      const accepted = ['workaround'];
      const userInput = 'workaround.';
      const normalized = normalizeAnswer(userInput);
      const isCorrect = accepted.some((a) => normalizeAnswer(a) === normalized);
      expect(isCorrect).toBe(true);
    });

    it('matches with extra whitespace', () => {
      const accepted = ['add'];
      const userInput = '  add  ';
      const normalized = normalizeAnswer(userInput);
      const isCorrect = accepted.some((a) => normalizeAnswer(a) === normalized);
      expect(isCorrect).toBe(true);
    });

    it('rejects incorrect answer', () => {
      const accepted = ['add'];
      const userInput = 'create';
      const normalized = normalizeAnswer(userInput);
      const isCorrect = accepted.some((a) => normalizeAnswer(a) === normalized);
      expect(isCorrect).toBe(false);
    });

    it('accepts any of multiple accepted answers', () => {
      const accepted = ['workaround', 'work-around'];
      const normalized = normalizeAnswer('work-around');
      const isCorrect = accepted.some((a) => normalizeAnswer(a) === normalized);
      expect(isCorrect).toBe(true);
    });
  });

  describe('reorder judging logic', () => {
    it('matches correct order', () => {
      const correctOrder = ['ch_1', 'ch_2', 'ch_3'];
      const userOrder = 'ch_1,ch_2,ch_3'.split(',');
      const isCorrect =
        userOrder.length === correctOrder.length &&
        userOrder.every((id, i) => id === correctOrder[i]);
      expect(isCorrect).toBe(true);
    });

    it('rejects incorrect order', () => {
      const correctOrder = ['ch_1', 'ch_2', 'ch_3'];
      const userOrder = 'ch_2,ch_1,ch_3'.split(',');
      const isCorrect =
        userOrder.length === correctOrder.length &&
        userOrder.every((id, i) => id === correctOrder[i]);
      expect(isCorrect).toBe(false);
    });

    it('rejects incomplete order', () => {
      const correctOrder = ['ch_1', 'ch_2', 'ch_3'];
      const userOrder = 'ch_1,ch_2'.split(',');
      const isCorrect =
        userOrder.length === correctOrder.length &&
        userOrder.every((id, i) => id === correctOrder[i]);
      expect(isCorrect).toBe(false);
    });
  });
});

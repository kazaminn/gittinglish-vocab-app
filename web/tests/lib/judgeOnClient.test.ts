import { describe, expect, it } from 'vitest';
import type { SessionStartItem } from '@shared/dto';
import { judgeOnClient } from '@shared/logic/judge';

const baseExplanation = {
  summary: 'summary',
  details: ['detail'],
};

function makeSelectItem(): SessionStartItem {
  return {
    itemId: 'p1',
    drillMode: 'word_to_meaning',
    judgeMeta: {
      kind: 'select',
      correctChoiceIds: ['c2'],
      correctAnswer: 'add a new feature',
    },
    currentProgress: { ease: 2.5, interval: 0, reps: 0 },
    problemDTO: {
      id: 'p1',
      pedagogicalKind: 'cloze',
      interactionType: 'select',
      drillMode: 'word_to_meaning',
      tags: { grammar: [] },
      prompt: 'add の意味は？',
      explanation: baseExplanation,
      difficulty: { level: 1 },
      payload: {
        stem: 'add',
        choices: [
          { id: 'c1', text: 'remove' },
          { id: 'c2', text: 'add a new feature' },
        ],
        choiceAnswerSpec: { mode: 'single' },
      },
    },
  };
}

function makeInputItem(): SessionStartItem {
  return {
    itemId: 'p2',
    drillMode: 'word_input',
    judgeMeta: {
      kind: 'input',
      acceptedAnswers: ['workaround', 'work-around'],
      correctAnswer: 'workaround',
    },
    currentProgress: { ease: 2.5, interval: 0, reps: 0 },
    problemDTO: {
      id: 'p2',
      pedagogicalKind: 'cloze',
      interactionType: 'input',
      drillMode: 'word_input',
      tags: { grammar: [] },
      prompt: '回避策',
      explanation: baseExplanation,
      difficulty: { level: 1 },
      payload: { stem: '___' },
    },
  };
}

describe('judgeOnClient', () => {
  it('marks select answers correct by choice id', () => {
    const item = makeSelectItem();
    expect(judgeOnClient(item, 'c2').isCorrect).toBe(true);
    expect(judgeOnClient(item, 'c1').isCorrect).toBe(false);
  });

  it('returns the correctAnswer text on select items', () => {
    const item = makeSelectItem();
    expect(judgeOnClient(item, 'c1').correctAnswer).toBe('add a new feature');
  });

  it('normalizes input answers (case, trailing punctuation, whitespace)', () => {
    const item = makeInputItem();
    expect(judgeOnClient(item, 'Workaround').isCorrect).toBe(true);
    expect(judgeOnClient(item, 'workaround.').isCorrect).toBe(true);
    expect(judgeOnClient(item, '  workaround  ').isCorrect).toBe(true);
    expect(judgeOnClient(item, 'work-around').isCorrect).toBe(true);
    expect(judgeOnClient(item, 'remove').isCorrect).toBe(false);
  });

  it('passes through the problem explanation', () => {
    const item = makeSelectItem();
    expect(judgeOnClient(item, 'c2').explanation).toEqual(baseExplanation);
  });

  it('throws when judgeMeta is missing', () => {
    const item = { ...makeSelectItem(), judgeMeta: undefined };
    expect(() => judgeOnClient(item, 'c2')).toThrow(/judgeMeta/);
  });
});

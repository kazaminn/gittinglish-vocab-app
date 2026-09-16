import { describe, expect, it } from 'vitest';
import { getProblemsForQuery } from '../../data/problem-loader.js';
import { judgeAnswer } from '../judge.js';

const selectProblem = getProblemsForQuery({
  dataset: 'gitverbs85',
  drillMode: 'word_to_meaning',
})[0]!;

describe('judgeAnswer', () => {
  it('judges select problems by choice id', () => {
    if (!('choiceAnswerSpec' in selectProblem))
      throw new Error('invalid fixture');

    const correctId = selectProblem.choiceAnswerSpec.correctChoiceIds[0]!;
    expect(judgeAnswer(selectProblem, correctId).isCorrect).toBe(true);
    expect(judgeAnswer(selectProblem, 'wrong-choice').isCorrect).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { getProblemsForQuery } from '../../data/problem-loader.js';
import { judgeAnswer } from '../judge.js';

const selectProblem = getProblemsForQuery({
  dataset: 'gitverbs85',
  drillMode: 'word_to_meaning',
})[0]!;

const inputProblem = getProblemsForQuery({
  dataset: 'gitverbs85',
  drillMode: 'word_input',
})[0]!;

const reorderProblem = getProblemsForQuery({
  dataset: 'gitverbs85',
  drillMode: 'reorder',
})[0]!;

describe('judgeAnswer', () => {
  it('judges select problems by choice id', () => {
    if (!('choiceAnswerSpec' in selectProblem)) throw new Error('invalid fixture');

    const correctId = selectProblem.choiceAnswerSpec.correctChoiceIds[0]!;
    expect(judgeAnswer(selectProblem, correctId).isCorrect).toBe(true);
    expect(judgeAnswer(selectProblem, 'wrong-choice').isCorrect).toBe(false);
  });

  it('judges input problems with normalization', () => {
    if (!('answerSpec' in inputProblem)) throw new Error('invalid fixture');

    const accepted = inputProblem.answerSpec.answers[0]!;
    expect(judgeAnswer(inputProblem, accepted.toUpperCase()).isCorrect).toBe(true);
    expect(judgeAnswer(inputProblem, `${accepted}.`).isCorrect).toBe(true);
    expect(judgeAnswer(inputProblem, 'definitely wrong').isCorrect).toBe(false);
  });

  it('judges reorder problems by chunk order', () => {
    if (!('correctOrder' in reorderProblem)) throw new Error('invalid fixture');

    expect(judgeAnswer(reorderProblem, reorderProblem.correctOrder.join(',')).isCorrect).toBe(
      true
    );
    expect(
      judgeAnswer(reorderProblem, [...reorderProblem.correctOrder].reverse().join(','))
        .isCorrect
    ).toBe(false);
  });
});

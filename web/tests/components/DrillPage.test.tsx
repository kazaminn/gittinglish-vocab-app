import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { type ClozeMcqProblem } from '@shared/domain';
import { type SessionStartItem, toProblemDTO } from '@shared/dto';
import { DrillPage } from '../../src/features/drill/DrillPage';
import { renderWithProviders } from '../test-utils';

const problem: ClozeMcqProblem = {
  id: 'nanj_001_w2m_1',
  sentenceId: 'nanj_001',
  pedagogicalKind: 'cloze',
  interactionType: 'select',
  drillMode: 'word_to_meaning',
  tags: { grammar: ['svo'] },
  prompt: "What does 'add' mean?",
  stem: 'add',
  choices: [
    { id: 'a', text: 'to add' },
    { id: 'b', text: 'to remove' },
    { id: 'c', text: 'to hide' },
    { id: 'd', text: 'to close' },
  ],
  choiceAnswerSpec: {
    mode: 'single',
    correctChoiceIds: ['a'],
  },
  explanation: {
    summary: 'add means to add',
  },
  difficulty: {
    level: 1,
  },
};

const item: SessionStartItem = {
  itemId: problem.id,
  drillMode: problem.drillMode,
  problemDTO: toProblemDTO(problem),
  judgeMeta: {
    kind: 'select',
    correctChoiceIds: ['a'],
    correctAnswer: 'to add',
  },
  currentProgress: {
    ease: 2.5,
    interval: 1,
    reps: 0,
  },
};

describe('DrillPage', () => {
  it('provides exit actions for home and settings', async () => {
    const user = userEvent.setup();
    const onExitToHome = vi.fn();

    renderWithProviders(
      <DrillPage
        item={item}
        currentIndex={0}
        totalCount={3}
        lastAnswer={undefined}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onExitToHome={onExitToHome}
      />
    );

    await user.click(screen.getByRole('button', { name: /> home/i }));

    expect(onExitToHome).toHaveBeenCalledTimes(1);
  });

  it('accepts keyboard number shortcuts for answer selection', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();

    renderWithProviders(
      <DrillPage
        item={item}
        currentIndex={0}
        totalCount={3}
        lastAnswer={undefined}
        onAnswer={onAnswer}
        onNext={vi.fn()}
        onExitToHome={vi.fn()}
      />
    );

    await user.keyboard('1');

    expect(onAnswer).toHaveBeenCalledWith('a');
  });
});

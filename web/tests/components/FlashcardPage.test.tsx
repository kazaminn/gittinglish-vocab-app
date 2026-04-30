import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { type ClozeMcqProblem } from '@shared/domain';
import { FlashcardPage } from '../../src/features/flashcard/FlashcardPage';
import { renderWithProviders } from '../test-utils';

const problem: ClozeMcqProblem = {
  id: 'nanj_001_w2m_1',
  sentenceId: 'nanj_001',
  pedagogicalKind: 'cloze',
  interactionType: 'select',
  drillMode: 'word_to_meaning',
  tags: {
    grammar: ['svo'],
    vocabulary: [
      {
        lemma: 'add',
        meaning: '加える',
        target: true,
      },
    ],
  },
  prompt: "What does 'add' mean?",
  stem: 'add',
  choices: [
    { id: 'a', text: '加える' },
    { id: 'b', text: '消す' },
  ],
  choiceAnswerSpec: {
    mode: 'single',
    correctChoiceIds: ['a'],
  },
  explanation: {
    summary: 'add means 加える',
  },
  difficulty: {
    level: 1,
  },
};

describe('FlashcardPage', () => {
  it('shows problem metadata and raw problem data', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <FlashcardPage
        problems={[problem]}
        datasetId="gitverbs85"
        sectionLabel={undefined}
        onBackToHome={vi.fn()}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /Showing word. Press to reveal answer./i })
    );

    expect(screen.getByText(/grammar: svo/i)).toBeInTheDocument();
    expect(screen.getByText(/vocabulary: add: 加える/i)).toBeInTheDocument();

    await user.click(screen.getByText(/problem data/i));
    expect(screen.getByText(/"sentenceId": "nanj_001"/i)).toBeInTheDocument();
  });
});

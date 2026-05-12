import { useState } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { type DatasetId } from '@shared/domain';
import {
  getAvailableModesForDataset,
  getDatasetOptions,
} from '../../src/data/problems';
import { HomePage, type HomeSelection } from '../../src/features/home/HomePage';
import { renderWithProviders } from '../test-utils';

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    isLoading: false,
    user: { id: 'u', displayName: 'tester', username: 'tester' },
    signOut: vi.fn(),
  }),
}));

function HomeHarness({
  onStartDrill,
}: {
  onStartDrill: (selection: HomeSelection) => void;
}) {
  const [selection, setSelection] = useState<HomeSelection>({
    datasetId: 'gitverbs85' satisfies DatasetId,
    drillMode: 'word_to_meaning',
    sessionSize: 20,
    sectionId: undefined,
  });

  return (
    <HomePage
      selection={selection}
      datasetOptions={getDatasetOptions()}
      availableModes={getAvailableModesForDataset(selection.datasetId)}
      sections={
        selection.datasetId === 'gitverbs85'
          ? [
              {
                id: 'section-1',
                label: 'Section 1 (1-70)',
                sentenceIds: ['s1'],
              },
            ]
          : []
      }
      problemCount={12}
      previewProblems={[]}
      onSelectionChange={setSelection}
      onStartDrill={onStartDrill}
    />
  );
}

describe('HomePage', () => {
  it('loads dataset selection', async () => {
    const user = userEvent.setup();
    const onStartDrill = vi.fn();

    renderWithProviders(<HomeHarness onStartDrill={onStartDrill} />);

    await user.click(screen.getByRole('radio', { name: /GitVerbs85/i }));

    expect(screen.getByLabelText(/reibun section/i)).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: /sentence cloze/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: /word → meaning/i })
    ).toBeInTheDocument();
  });

  it('starts a drill with the current dataset selection', async () => {
    const user = userEvent.setup();
    const onStartDrill = vi.fn();

    renderWithProviders(<HomeHarness onStartDrill={onStartDrill} />);

    await user.click(screen.getAllByRole('button', { name: /> start/i })[0]!);

    expect(onStartDrill).toHaveBeenCalledWith(
      expect.objectContaining({
        datasetId: 'gitverbs85',
        drillMode: 'word_to_meaning',
        sessionSize: 20,
      })
    );
  });

  it('renders backend stats when provided', () => {
    const onStartDrill = vi.fn();

    renderWithProviders(
      <HomePage
        selection={{
          datasetId: 'gitverbs85',
          drillMode: 'word_to_meaning',
          sessionSize: 20,
        }}
        datasetOptions={getDatasetOptions()}
        availableModes={getAvailableModesForDataset('gitverbs85')}
        sections={[]}
        problemCount={12}
        previewProblems={[]}
        stats={{
          totalReviewed: 42,
          totalCorrect: 30,
          streakDays: 5,
          dueToday: 7,
        }}
        onSelectionChange={vi.fn()}
        onStartDrill={onStartDrill}
      />
    );

    expect(screen.getByText('reviewed')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('5 days')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });
});

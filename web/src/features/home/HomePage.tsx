import { useMemo, useRef, type MutableRefObject } from 'react';
import {
  type DatasetId,
  type DrillMode,
  type GeneratedProblem,
} from '@shared/domain';
import { type UserStatsResponse } from '@shared/dto';
import {
  type DatasetOption,
  type ProblemSection,
} from '../../data/problems';
import { useAuth } from '../../hooks/useAuth';
import { Shell } from '../../components/Shell';

/* eslint-disable jsx-a11y/prefer-tag-over-role */

export interface HomeSelection {
  datasetId: DatasetId;
  drillMode: DrillMode;
  sectionId?: string;
  sessionSize: number;
}

interface HomePageProps {
  selection: HomeSelection;
  datasetOptions: DatasetOption[];
  availableModes: DrillMode[];
  sections: ProblemSection[];
  problemCount: number;
  previewProblems: GeneratedProblem[];
  stats?: UserStatsResponse;
  isStatsLoading?: boolean;
  statsError?: string;
  onSelectionChange: (selection: HomeSelection) => void;
  onStartDrill: (selection: HomeSelection) => void;
}

interface ModeOption {
  mode: DrillMode;
  label: string;
  description: string;
  category: 'drill' | 'browse';
}

const MODE_OPTIONS: Record<DrillMode, ModeOption> = {
  word_to_meaning: {
    mode: 'word_to_meaning',
    label: 'word → meaning',
    description: 'four-choice',
    category: 'drill',
  },
  meaning_to_word: {
    mode: 'meaning_to_word',
    label: 'meaning → word',
    description: 'four-choice',
    category: 'drill',
  },
  word_input: {
    mode: 'word_input',
    label: 'word input',
    description: 'type the word',
    category: 'drill',
  },
  sentence_cloze: {
    mode: 'sentence_cloze',
    label: 'sentence cloze',
    description: 'four-choice',
    category: 'drill',
  },
  sentence_input: {
    mode: 'sentence_input',
    label: 'sentence input',
    description: 'type the word',
    category: 'drill',
  },
  reorder: {
    mode: 'reorder',
    label: 'reorder',
    description: 'swap chunks',
    category: 'drill',
  },
  flashcard: {
    mode: 'flashcard',
    label: 'flashcard',
    description: 'browse only',
    category: 'browse',
  },
};

function getPreviewTitle(problem: GeneratedProblem): string {
  if ('stem' in problem) return problem.stem;
  if ('chunks' in problem) {
    return problem.chunks.map((chunk) => chunk.text).join(' ');
  }
  return problem.prompt;
}

function moveFocus(
  refs: MutableRefObject<(HTMLButtonElement | null)[]>,
  currentIndex: number,
  direction: 1 | -1
) {
  const count = refs.current.length;
  if (count === 0) return;

  const nextIndex = (currentIndex + direction + count) % count;
  refs.current[nextIndex]?.focus();
}

export function HomePage({
  selection,
  datasetOptions,
  availableModes,
  sections,
  problemCount,
  previewProblems,
  stats,
  isStatsLoading = false,
  statsError,
  onSelectionChange,
  onStartDrill,
}: HomePageProps) {
  const { user } = useAuth();
  const datasetRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const modeRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const visibleModes = useMemo(
    () => availableModes.map((mode) => MODE_OPTIONS[mode]),
    [availableModes]
  );
  const selectedMode = MODE_OPTIONS[selection.drillMode];

  function handleDatasetChange(datasetId: DatasetId) {
    onSelectionChange({
      ...selection,
      datasetId,
      sectionId: undefined,
    });
  }

  function handleModeChange(drillMode: DrillMode) {
    onSelectionChange({
      ...selection,
      drillMode,
    });
  }

  return (
    <Shell title="gittinglish">
      {user && (
        <div
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Learning stats"
        >
          {statsError ? (
            <div
              className="rounded-sm border px-4 py-4 text-sm"
              style={{
                background: 'var(--bg-error)',
                borderColor: 'var(--border-error)',
                color: 'var(--text-error)',
              }}
            >
              failed to load stats
            </div>
          ) : (
            (
              [
                ['reviewed', stats?.totalReviewed ?? 0],
                ['correct', stats?.totalCorrect ?? 0],
                ['streak', `${stats?.streakDays ?? 0} days`],
                ['due today', stats?.dueToday ?? 0],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded-sm border px-4 py-4"
                style={{
                  background: 'transparent',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {label}
                </p>
                <p
                  className="mt-2 text-2xl"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {isStatsLoading ? '...' : value}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      <div className="space-y-2">
        <p style={{ color: 'var(--text-secondary)' }}>dataset</p>
        <div role="radiogroup" aria-label="Dataset" className="space-y-1">
          {datasetOptions.map((option, index) => {
            const isSelected = selection.datasetId === option.id;
            return (
              <button
                key={option.id}
                ref={(element) => {
                  datasetRefs.current[index] = element;
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => handleDatasetChange(option.id)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
                    event.preventDefault();
                    moveFocus(datasetRefs, index, 1);
                  }

                  if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
                    event.preventDefault();
                    moveFocus(datasetRefs, index, -1);
                  }

                  if (event.key === ' ' || event.key === 'Enter') {
                    event.preventDefault();
                    handleDatasetChange(option.id);
                  }
                }}
                className="w-full rounded-sm border px-4 py-2 text-left text-sm"
                style={{
                  background: isSelected ? 'var(--bg-selected)' : 'transparent',
                  borderColor: isSelected
                    ? 'var(--border-accent)'
                    : 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <span className="mr-2" style={{ color: 'var(--text-muted)' }}>
                  {isSelected ? '>' : ' '}
                </span>
                {option.label}
                <span
                  className="ml-2 text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ({option.description})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {sections.length > 0 && (
        <div className="space-y-2">
          <label
            htmlFor="section-select"
            className="block text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            reibun section
          </label>
          <select
            id="section-select"
            value={selection.sectionId ?? ''}
            onChange={(event) =>
              onSelectionChange({
                ...selection,
                sectionId: event.target.value || undefined,
              })
            }
            className="w-full rounded-sm border px-3 py-2"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">All sections</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <p style={{ color: 'var(--text-secondary)' }}>mode</p>
        <div role="radiogroup" aria-label="Drill mode" className="space-y-1">
          {visibleModes.map((option, index) => {
            const isSelected = selection.drillMode === option.mode;
            return (
              <button
                key={option.mode}
                ref={(element) => {
                  modeRefs.current[index] = element;
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => handleModeChange(option.mode)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
                    event.preventDefault();
                    moveFocus(modeRefs, index, 1);
                  }

                  if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
                    event.preventDefault();
                    moveFocus(modeRefs, index, -1);
                  }

                  if (event.key === ' ' || event.key === 'Enter') {
                    event.preventDefault();
                    handleModeChange(option.mode);
                  }
                }}
                className="w-full rounded-sm border px-4 py-2 text-left text-sm"
                style={{
                  background: isSelected ? 'var(--bg-selected)' : 'transparent',
                  borderColor: isSelected
                    ? 'var(--border-accent)'
                    : 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <span className="mr-2" style={{ color: 'var(--text-muted)' }}>
                  {isSelected ? '>' : ' '}
                </span>
                {option.label}
                <span
                  className="ml-2 text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ({option.description})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedMode?.category === 'drill' && (
        <div className="space-y-2">
          <label
            htmlFor="session-size"
            className="block text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            session size: {selection.sessionSize}
          </label>
          <input
            id="session-size"
            type="range"
            min={5}
            max={50}
            step={5}
            value={selection.sessionSize}
            onChange={(event) =>
              onSelectionChange({
                ...selection,
                sessionSize: Number(event.target.value),
              })
            }
            className="w-full accent-accent"
          />
          <div
            className="flex justify-between text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>5</span>
            <span>50</span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => onStartDrill(selection)}
        disabled={!user}
        className="w-full rounded-sm border px-4 py-3 text-left"
        style={{
          background: 'transparent',
          borderColor: 'var(--border-accent)',
          color: 'var(--text-accent)',
        }}
      >
        &gt; start
      </button>

      <div className="space-y-2 rounded-sm border px-4 py-4">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          current problem list
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {problemCount} problems available
          {user ? ` · ${user.displayName}` : ''}
        </p>
        <ul className="space-y-2 text-sm">
          {previewProblems.map((problem) => (
            <li key={problem.id} className="border-t pt-2 first:border-t-0 first:pt-0">
              <p style={{ color: 'var(--text-primary)' }}>
                {getPreviewTitle(problem)}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {problem.id} · {problem.prompt}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Shell>
  );
}

import { useMemo } from 'react';
import {
  type DatasetId,
  type DrillMode,
  type GeneratedProblem,
} from '@shared/domain';
import { type UserStatsResponse } from '@shared/dto';
import { Button } from '../../components/Button';
import { RadioOptionGroup } from '../../components/RadioOptionGroup';
import { Shell } from '../../components/Shell';
import { SkeletonLine } from '../../components/ShellSkeleton';
import { StatCard } from '../../components/StatCard';
import { type DatasetOption, type ProblemSection } from '../../data/problems';
import { useAuth } from '../../hooks/useAuth';

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
  isProblemsLoading?: boolean;
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

function optionLabel(label: string, description: string) {
  return (
    <>
      {label}
      <span className="ml-2 text-xs text-muted">({description})</span>
    </>
  );
}

export function HomePage({
  selection,
  datasetOptions,
  availableModes,
  sections,
  problemCount,
  previewProblems,
  isProblemsLoading = false,
  stats,
  isStatsLoading = false,
  statsError,
  onSelectionChange,
  onStartDrill,
}: HomePageProps) {
  const { user } = useAuth();

  const visibleModes = useMemo(
    () => availableModes.map((mode) => MODE_OPTIONS[mode]),
    [availableModes]
  );
  const selectedMode = MODE_OPTIONS[selection.drillMode];

  function handleDatasetChange(datasetId: DatasetId) {
    onSelectionChange({ ...selection, datasetId, sectionId: undefined });
  }

  function handleModeChange(drillMode: DrillMode) {
    onSelectionChange({ ...selection, drillMode });
  }

  return (
    <Shell title="gittinglish">
      {user && (
        <div
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Learning stats"
        >
          {statsError ? (
            <StatCard tone="error" label="" value="failed to load stats" />
          ) : (
            (
              [
                ['reviewed', stats?.totalReviewed ?? 0],
                ['correct', stats?.totalCorrect ?? 0],
                ['streak', `${stats?.streakDays ?? 0} days`],
                ['due today', stats?.dueToday ?? 0],
              ] as const
            ).map(([label, value]) => (
              <StatCard
                key={label}
                label={label}
                value={value}
                loading={isStatsLoading}
              />
            ))
          )}
        </div>
      )}

      <RadioOptionGroup
        heading="dataset"
        ariaLabel="Dataset"
        items={datasetOptions}
        getKey={(option) => option.id}
        selectedKey={selection.datasetId}
        onSelect={(option) => handleDatasetChange(option.id)}
        indicator={(_option, isSelected) => (isSelected ? '>' : ' ')}
        renderLabel={(option) => optionLabel(option.label, option.description)}
      />

      {sections.length > 0 && (
        <div className="space-y-2">
          <label
            htmlFor="section-select"
            className="block text-sm text-secondary"
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
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-primary"
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

      <RadioOptionGroup
        heading="mode"
        ariaLabel="Drill mode"
        items={visibleModes}
        getKey={(option) => option.mode}
        selectedKey={selection.drillMode}
        onSelect={(option) => handleModeChange(option.mode)}
        indicator={(_option, isSelected) => (isSelected ? '>' : ' ')}
        renderLabel={(option) => optionLabel(option.label, option.description)}
      />

      {selectedMode?.category === 'drill' && (
        <div className="space-y-2">
          <label
            htmlFor="session-size"
            className="block text-sm text-secondary"
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
          <div className="flex justify-between text-xs text-muted">
            <span>5</span>
            <span>50</span>
          </div>
        </div>
      )}

      <Button
        variant="outline"
        fullWidth
        disabled={!user}
        onClick={() => onStartDrill(selection)}
      >
        &gt; start
      </Button>

      <PreviewList
        userDisplayName={user?.displayName}
        problemCount={problemCount}
        previewProblems={previewProblems}
        isProblemsLoading={isProblemsLoading}
      />
    </Shell>
  );
}

interface PreviewListProps {
  userDisplayName?: string;
  problemCount: number;
  previewProblems: GeneratedProblem[];
  isProblemsLoading: boolean;
}

function PreviewList({
  userDisplayName,
  problemCount,
  previewProblems,
  isProblemsLoading,
}: PreviewListProps) {
  return (
    <div className="space-y-2 rounded-sm border border-border px-4 py-4">
      <p className="text-sm text-secondary">current problem list</p>
      <p className="text-xs text-muted">
        {isProblemsLoading
          ? 'loading problems…'
          : `${problemCount} problems available`}
        {userDisplayName ? ` · ${userDisplayName}` : ''}
      </p>
      {isProblemsLoading && previewProblems.length === 0 ? (
        <div className="space-y-3 pt-1" aria-hidden="true">
          <SkeletonLine />
          <SkeletonLine width="80%" />
          <SkeletonLine width="60%" />
        </div>
      ) : (
        <ul className="space-y-2 text-sm">
          {previewProblems.map((problem) => (
            <li
              key={problem.id}
              className="border-t border-border pt-2 first:border-t-0 first:pt-0"
            >
              <p className="text-primary">{getPreviewTitle(problem)}</p>
              <p className="text-xs text-muted">
                {problem.id} · {problem.prompt}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { type DrillMode } from '@shared/domain';
import { ProgressBar } from '../../components/ProgressBar';
import { Shell } from '../../components/Shell';
import { type AnswerResult } from '../../hooks/useDrill';

const DRILL_MODE_LABELS: Record<DrillMode, string> = {
  word_to_meaning: 'word → meaning',
  meaning_to_word: 'meaning → word',
  word_input: 'word input',
  sentence_cloze: 'sentence cloze',
  sentence_input: 'sentence input',
  reorder: 'reorder',
  flashcard: 'flashcard',
};

interface SummaryPageProps {
  results: AnswerResult[];
  correctCount: number;
  totalCount: number;
  drillMode: DrillMode;
  onBackToHome: () => void;
}

export function SummaryPage({
  results,
  correctCount,
  totalCount,
  drillMode,
  onBackToHome,
}: SummaryPageProps) {
  const percentage =
    totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <Shell title="result review">
      <ProgressBar current={totalCount} total={totalCount} />

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-3">
        {(
          [
            ['accuracy', `${percentage}%`],
            ['correct', `${correctCount} / ${totalCount}`],
            ['mode', DRILL_MODE_LABELS[drillMode]],
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
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {results.map((item, idx) => (
          <div
            key={item.problemId}
            className="rounded-sm border px-4 py-4"
            style={{
              background: 'transparent',
              borderColor: item.isCorrect
                ? 'var(--border-success)'
                : 'var(--border-error)',
            }}
          >
            <div
              className="flex flex-wrap items-center gap-2 text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              <span>[{idx + 1}]</span>
              <span>{item.isCorrect ? 'correct' : 'incorrect'}</span>
            </div>
            <p className="mt-3" style={{ color: 'var(--text-primary)' }}>
              {item.stem}
            </p>
            <div className="mt-3 space-y-1 text-sm">
              <p style={{ color: 'var(--text-secondary)' }}>
                user:{' '}
                <span style={{ color: 'var(--text-primary)' }}>
                  {item.userAnswer}
                </span>
              </p>
              <p style={{ color: 'var(--text-secondary)' }}>
                answer:{' '}
                <span
                  style={{
                    color: item.isCorrect
                      ? 'var(--text-success)'
                      : 'var(--text-accent)',
                  }}
                >
                  {item.correctAnswer}
                </span>
              </p>
            </div>
            <p
              className="mt-3 text-sm leading-7"
              style={{ color: 'var(--text-muted)' }}
            >
              {item.explanation}
            </p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onBackToHome}
        className="w-full rounded-sm border px-4 py-3 text-left"
        style={{
          background: 'transparent',
          borderColor: 'var(--border-accent)',
          color: 'var(--text-accent)',
        }}
      >
        &gt; home
      </button>
    </Shell>
  );
}

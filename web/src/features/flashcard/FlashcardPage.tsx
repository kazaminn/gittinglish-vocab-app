import { useState } from 'react';
import { type GeneratedProblem } from '@shared/domain';
import { ProgressBar } from '../../components/ProgressBar';
import { Shell } from '../../components/Shell';
import { type DatasetId } from '../../data/problems';

interface FlashcardPageProps {
  problems: GeneratedProblem[];
  datasetId: DatasetId;
  sectionLabel?: string;
  onBackToHome: () => void;
}

function getStem(problem: GeneratedProblem): string {
  if ('stem' in problem) return problem.stem;
  return '';
}

function getMeaning(problem: GeneratedProblem): string {
  if ('choices' in problem && 'choiceAnswerSpec' in problem) {
    const correctId = problem.choiceAnswerSpec.correctChoiceIds[0];
    const correct = problem.choices.find((c) => c.id === correctId);
    return correct?.text ?? '';
  }
  if ('answerSpec' in problem) {
    return problem.answerSpec.answers[0] ?? '';
  }
  return '';
}

function getGrammarSummary(problem: GeneratedProblem): string {
  return problem.tags.grammar.join(', ');
}

function getVocabularySummary(problem: GeneratedProblem): string {
  return (
    problem.tags.vocabulary
      ?.map((tag) => (tag.meaning ? `${tag.lemma}: ${tag.meaning}` : tag.lemma))
      .join(' / ') ?? 'No vocabulary metadata'
  );
}

export function FlashcardPage({
  problems,
  datasetId,
  sectionLabel,
  onBackToHome,
}: FlashcardPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const problem = problems[currentIndex];
  if (!problem) {
    return (
      <Shell title="flashcard">
        <p style={{ color: 'var(--text-muted)' }}>No cards available.</p>
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

  const stem = getStem(problem);
  const meaning = getMeaning(problem);

  function handleFlip() {
    setIsFlipped((prev) => !prev);
  }

  function handleNext() {
    if (currentIndex < problems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleFlip();
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      handleNext();
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      handlePrev();
    }
  }

  return (
    <Shell title="flashcard">
      <button
        type="button"
        onClick={onBackToHome}
        className="w-full rounded-sm border px-4 py-2 text-left text-sm"
        style={{
          background: 'transparent',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-muted)',
        }}
      >
        &gt; home
      </button>

      <ProgressBar current={currentIndex + 1} total={problems.length} />

      <div
        className="rounded-sm border px-4 py-3 text-xs"
        style={{
          background: 'transparent',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-muted)',
        }}
      >
        dataset: {datasetId}
        {sectionLabel ? ` · ${sectionLabel}` : ''}
      </div>

      {/* Card */}
      <button
        type="button"
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
        aria-label={
          isFlipped
            ? 'Showing answer. Press to flip back.'
            : 'Showing word. Press to reveal answer.'
        }
        className="w-full cursor-pointer rounded-sm border px-6 py-8 text-center"
        style={{
          background: isFlipped ? 'var(--bg-elevated)' : 'transparent',
          borderColor: isFlipped
            ? 'var(--border-accent)'
            : 'var(--border-subtle)',
        }}
      >
        {!isFlipped ? (
          <>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              &gt; {problem.prompt}
            </p>
            <p
              className="mt-4 text-2xl"
              style={{ color: 'var(--text-primary)' }}
            >
              {stem}
            </p>
            <p className="mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
              tap to flip
            </p>
          </>
        ) : (
          <>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              answer
            </p>
            <p className="mt-4 text-xl" style={{ color: 'var(--text-accent)' }}>
              {meaning}
            </p>
            <p
              className="mt-4 text-sm leading-7"
              style={{ color: 'var(--text-secondary)' }}
            >
              {problem.explanation.summary}
            </p>
            <p
              className="mt-4 text-xs leading-6"
              style={{ color: 'var(--text-muted)' }}
            >
              grammar: {getGrammarSummary(problem)}
            </p>
            <p
              className="mt-2 text-xs leading-6"
              style={{ color: 'var(--text-muted)' }}
            >
              vocabulary: {getVocabularySummary(problem)}
            </p>
          </>
        )}
      </button>

      {/* Navigation */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex-1 rounded-sm border px-4 py-3 text-left"
          style={{
            background: 'transparent',
            borderColor:
              currentIndex > 0
                ? 'var(--border-accent)'
                : 'var(--border-subtle)',
            color:
              currentIndex > 0 ? 'var(--text-accent)' : 'var(--text-muted)',
          }}
        >
          &lt; prev
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={currentIndex >= problems.length - 1}
          className="flex-1 rounded-sm border px-4 py-3 text-right"
          style={{
            background: 'transparent',
            borderColor:
              currentIndex < problems.length - 1
                ? 'var(--border-accent)'
                : 'var(--border-subtle)',
            color:
              currentIndex < problems.length - 1
                ? 'var(--text-accent)'
                : 'var(--text-muted)',
          }}
        >
          next &gt;
        </button>
      </div>

      <details
        className="rounded-sm border px-4 py-3"
        style={{
          background: 'transparent',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-secondary)',
        }}
      >
        <summary className="cursor-pointer text-sm">problem data</summary>
        <pre
          className="mt-3 overflow-x-auto text-xs leading-6"
          style={{ color: 'var(--text-muted)' }}
        >
          {JSON.stringify(problem, null, 2)}
        </pre>
      </details>
    </Shell>
  );
}

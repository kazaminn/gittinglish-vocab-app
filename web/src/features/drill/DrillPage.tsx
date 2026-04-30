import { useEffect, useRef } from 'react';
import { type SessionStartItem } from '@shared/dto';
import { ChoiceList } from '../../components/ChoiceList';
import { FeedbackBlock } from '../../components/FeedbackBlock';
import { ProgressBar } from '../../components/ProgressBar';
import { ReorderList } from '../../components/ReorderList';
import { Shell } from '../../components/Shell';
import { TextInput } from '../../components/TextInput';
import { type AnswerResult } from '../../hooks/useDrill';

interface DrillPageProps {
  item: SessionStartItem;
  currentIndex: number;
  totalCount: number;
  lastAnswer: AnswerResult | undefined;
  onAnswer: (answer: string) => void | Promise<unknown>;
  onNext: () => void | Promise<void>;
  onExitToHome: () => void;
}

function getStem(problem: SessionStartItem['problemDTO']): string {
  if ('stem' in problem.payload) return problem.payload.stem;
  return '';
}

export function DrillPage({
  item,
  currentIndex,
  totalCount,
  lastAnswer,
  onAnswer,
  onNext,
  onExitToHome,
}: DrillPageProps) {
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const problem = item.problemDTO;

  useEffect(() => {
    if (lastAnswer) {
      nextButtonRef.current?.focus();
    }
  }, [lastAnswer]);

  const stem = getStem(problem);

  return (
    <Shell title="gittinglish drill">
      <button
        type="button"
        onClick={onExitToHome}
        className="w-full rounded-sm border px-4 py-2 text-left text-sm"
        style={{
          background: 'transparent',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-muted)',
        }}
      >
        &gt; home
      </button>

      <ProgressBar current={currentIndex + 1} total={totalCount} />

      {/* Prompt */}
      <div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          &gt; {problem.prompt}
        </p>
        {stem && (
          <p
            className="mt-2 text-xl md:text-2xl"
            style={{ color: 'var(--text-primary)' }}
          >
            {stem}
          </p>
        )}
      </div>

      {/* Answer area — dispatch by problem type */}
      {problem.interactionType === 'select' && 'choices' in problem.payload && (
        <ChoiceList
          choices={problem.payload.choices}
          selectedId={
            lastAnswer
              ? lastAnswer.isCorrect
                ? item.judgeMeta?.kind === 'select'
                  ? item.judgeMeta.correctChoiceIds[0]
                  : undefined
                : undefined
              : undefined
          }
          correctId={
            item.judgeMeta?.kind === 'select'
              ? item.judgeMeta.correctChoiceIds[0] ?? ''
              : ''
          }
          showResult={lastAnswer !== undefined}
          onSelect={(id) => {
            if (!lastAnswer) {
              void onAnswer(id);
            }
          }}
          disabled={lastAnswer !== undefined}
        />
      )}

      {problem.interactionType === 'input' && (
        <TextInput
          key={problem.id}
          onSubmit={(value) => {
            if (!lastAnswer) {
              void onAnswer(value);
            }
          }}
          disabled={lastAnswer !== undefined}
          placeholder="type your answer..."
        />
      )}

      {problem.interactionType === 'reorder' && 'chunks' in problem.payload && (
        <ReorderList
          key={problem.id}
          chunks={problem.payload.chunks}
          onSubmit={(orderedIds) => {
            if (!lastAnswer) {
              void onAnswer(orderedIds.join(','));
            }
          }}
          disabled={lastAnswer !== undefined}
        />
      )}

      {/* Feedback */}
      {lastAnswer && (
        <>
          <FeedbackBlock
            isCorrect={lastAnswer.isCorrect}
            explanation={lastAnswer.explanation}
          />
          <button
            ref={nextButtonRef}
            type="button"
            onClick={() => {
              void onNext();
            }}
            className="w-full rounded-sm border px-4 py-3 text-left"
            style={{
              background: 'transparent',
              borderColor: 'var(--border-accent)',
              color: 'var(--text-accent)',
            }}
          >
            &gt; {currentIndex + 1 < totalCount ? 'next' : 'review result'}
          </button>
        </>
      )}
    </Shell>
  );
}

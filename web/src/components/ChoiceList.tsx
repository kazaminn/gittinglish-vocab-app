import { useEffect, useRef } from 'react';
import { type Choice } from '@shared/domain';

interface ChoiceListProps {
  choices: Choice[];
  selectedId: string | undefined;
  correctId: string;
  showResult: boolean;
  onSelect: (id: string) => void;
  disabled: boolean;
}

export function ChoiceList({
  choices,
  selectedId,
  correctId,
  showResult,
  onSelect,
  disabled,
}: ChoiceListProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!disabled) refs.current[0]?.focus();
  }, [disabled]);

  function onKeyDown(e: React.KeyboardEvent, idx: number) {
    if (disabled) return;

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      refs.current[(idx + 1) % choices.length]?.focus();
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      refs.current[(idx - 1 + choices.length) % choices.length]?.focus();
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const choice = choices[idx];
      if (choice) onSelect(choice.id);
    }
    const num = Number(e.key);
    if (num >= 1 && num <= choices.length) {
      const choice = choices[num - 1];
      if (choice) onSelect(choice.id);
    }
  }

  return (
    <div role="radiogroup" aria-label="Answer choices" className="space-y-2">
      {choices.map((choice, i) => {
        const isSelected = selectedId === choice.id;
        const isCorrect = showResult && choice.id === correctId;
        const isIncorrect = showResult && isSelected && choice.id !== correctId;

        let background = 'transparent';
        let borderColor = 'var(--border-subtle)';
        let textColor = 'var(--text-primary)';

        if (isSelected && !showResult) {
          background = 'var(--bg-selected)';
          borderColor = 'var(--border-accent)';
        }
        if (isCorrect) {
          background = 'var(--bg-success)';
          borderColor = 'var(--border-success)';
          textColor = 'var(--text-success)';
        }
        if (isIncorrect) {
          background = 'var(--bg-error)';
          borderColor = 'var(--border-error)';
          textColor = 'var(--text-error)';
        }

        return (
          // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- native radio cannot be styled as CLI-style button
          <button
            key={choice.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={i === 0 ? 0 : -1}
            onClick={() => onSelect(choice.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            disabled={disabled}
            className="w-full rounded-sm border px-4 py-3 text-left"
            style={{ background, borderColor, color: textColor }}
          >
            <span className="mr-2" style={{ color: 'var(--text-muted)' }}>
              [{i + 1}]
            </span>
            {choice.text}
          </button>
        );
      })}
    </div>
  );
}

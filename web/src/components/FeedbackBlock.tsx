interface FeedbackBlockProps {
  isCorrect: boolean;
  explanation: string;
}

export function FeedbackBlock({ isCorrect, explanation }: FeedbackBlockProps) {
  const background = isCorrect ? 'var(--bg-success)' : 'var(--bg-error)';
  const borderColor = isCorrect
    ? 'var(--border-success)'
    : 'var(--border-error)';
  const textColor = isCorrect ? 'var(--text-success)' : 'var(--text-error)';

  return (
    <div className="space-y-3">
      <output
        aria-live="polite"
        className="block rounded-sm border px-4 py-3"
        style={{ background, borderColor, color: textColor }}
      >
        {isCorrect ? 'status: correct' : 'status: incorrect'}
      </output>
      <div
        className="rounded-sm border px-4 py-3"
        style={{
          background: 'transparent',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-secondary)',
        }}
      >
        <p style={{ color: 'var(--text-muted)' }}>&gt; explanation</p>
        <p className="mt-2 leading-7">{explanation}</p>
      </div>
    </div>
  );
}

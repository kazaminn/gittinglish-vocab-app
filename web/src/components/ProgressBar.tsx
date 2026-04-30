interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const filled = Math.max(0, Math.min(10, Math.round((current / total) * 10)));
  const empty = 10 - filled;
  const pct = Math.round((current / total) * 100);
  return (
    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
      <progress
        value={current}
        max={total}
        aria-label={`Progress: ${current} of ${total}`}
        className="sr-only"
      />
      <span aria-hidden="true">
        progress [{'#'.repeat(filled)}
        {'.'.repeat(empty)}] {pct}%
      </span>
    </div>
  );
}

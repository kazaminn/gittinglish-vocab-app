import { type ReactNode } from 'react';
import { tv } from '../lib/tv';

const statCard = tv({
  base: 'rounded-sm border px-4 py-4',
  variants: {
    tone: {
      default: 'border-border',
      error: 'bg-error-surface border-border-error text-error text-sm',
    },
  },
  defaultVariants: {
    tone: 'default',
  },
});

interface StatCardProps {
  label: string;
  value: ReactNode;
  loading?: boolean;
  tone?: 'default' | 'error';
}

export function StatCard({
  label,
  value,
  loading = false,
  tone = 'default',
}: StatCardProps) {
  if (tone === 'error') {
    return <div className={statCard({ tone })}>{value}</div>;
  }

  return (
    <div className={statCard({ tone })}>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-2 text-2xl text-primary">{loading ? '...' : value}</p>
    </div>
  );
}

interface SkeletonLineProps {
  width?: string;
}

export function SkeletonLine({ width = '100%' }: SkeletonLineProps) {
  return (
    <span
      aria-hidden="true"
      className="block h-4 animate-pulse rounded-sm"
      style={{ background: 'var(--bg-elevated)', width }}
    />
  );
}

interface ShellSkeletonProps {
  lines?: number;
}

export function ShellSkeleton({ lines = 5 }: ShellSkeletonProps) {
  return (
    <main className="mx-auto w-full max-w-[var(--container-max)] p-4 font-mono md:p-6">
      {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- container holds block-level placeholders, which <output> (phrasing content) cannot */}
      <section
        role="status"
        aria-busy="true"
        aria-label="loading"
        className="rounded-sm border p-4 md:p-6"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <p style={{ color: 'var(--text-muted)' }}>$ loading…</p>
        <div className="mt-5 space-y-3">
          {Array.from({ length: lines }, (_, index) => (
            <SkeletonLine
              key={index}
              width={index % 3 === 2 ? '60%' : '100%'}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

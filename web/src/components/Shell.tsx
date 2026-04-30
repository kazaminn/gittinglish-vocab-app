import { type ReactNode } from 'react';

interface ShellProps {
  title: string;
  children: ReactNode;
}

export function Shell({ title, children }: ShellProps) {
  return (
    <main className="mx-auto w-full max-w-[var(--container-max)] p-4 font-mono md:p-6">
      <section
        className="rounded-sm border p-4 md:p-6"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        <p style={{ color: 'var(--text-muted)' }}>$ {title}</p>
        <div className="mt-5 space-y-5">{children}</div>
      </section>
    </main>
  );
}

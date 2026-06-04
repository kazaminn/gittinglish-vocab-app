import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ShellSkeleton } from '../../src/components/ShellSkeleton';

describe('ShellSkeleton', () => {
  it('exposes a busy loading status to assistive tech', () => {
    render(<ShellSkeleton />);

    const status = screen.getByRole('status', { name: /loading/i });
    expect(status).toHaveAttribute('aria-busy', 'true');
  });
});

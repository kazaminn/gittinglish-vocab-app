import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatCard } from '../../src/components/StatCard';

describe('StatCard', () => {
  it('renders the label and value', () => {
    render(<StatCard label="reviewed" value={42} />);
    expect(screen.getByText('reviewed')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('shows a placeholder while loading', () => {
    render(<StatCard label="reviewed" value={42} loading />);
    expect(screen.getByText('...')).toBeInTheDocument();
    expect(screen.queryByText('42')).not.toBeInTheDocument();
  });

  it('renders just the message in the error tone', () => {
    render(<StatCard tone="error" label="" value="failed to load stats" />);
    expect(screen.getByText('failed to load stats')).toBeInTheDocument();
  });
});

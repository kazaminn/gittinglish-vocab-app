import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useAuth } from '../../src/hooks/useAuth';
import { renderWithProviders } from '../test-utils';

function AuthProbe() {
  const outside = useAuth();
  const inside = useAuth();

  return (
    <div>
      <p>outside:{outside.user?.displayName ?? 'guest'}</p>
      <p>{inside.user ? 'guard:allowed' : 'guard:blocked'}</p>
      <button
        type="button"
        onClick={() => {
          void outside.signOut();
        }}
      >
        logout
      </button>
      <button
        type="button"
        onClick={() => {
          void outside.signInAsGuest();
        }}
      >
        guest login
      </button>
      <button
        type="button"
        onClick={() => {
          void outside.signInWithGoogle();
        }}
      >
        google login
      </button>
    </div>
  );
}

describe('useAuth', () => {
  it('keeps auth state shared between guard-like and non-guard consumers', async () => {
    const user = userEvent.setup();

    renderWithProviders(<AuthProbe />);

    expect(screen.getByText('outside:Local User')).toBeInTheDocument();
    expect(screen.getByText('guard:allowed')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /logout/i }));

    expect(screen.getByText('outside:guest')).toBeInTheDocument();
    expect(screen.getByText('guard:blocked')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /google login/i }));

    expect(screen.getByText('outside:Google User')).toBeInTheDocument();
    expect(screen.getByText('guard:allowed')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /logout/i }));

    expect(screen.getByText('outside:guest')).toBeInTheDocument();
    expect(screen.getByText('guard:blocked')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /guest login/i }));

    expect(screen.getByText('outside:Local User')).toBeInTheDocument();
    expect(screen.getByText('guard:allowed')).toBeInTheDocument();
  });
});

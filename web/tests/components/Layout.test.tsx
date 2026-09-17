import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as ReactRouterDom from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Layout } from '../../src/components/Layout';
import { renderWithProviders } from '../test-utils';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof ReactRouterDom>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockSignOut = vi.fn();

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    isLoading: false,
    user: { id: 'u', displayName: 'Tester', username: 'tester' },
    signOut: mockSignOut,
  }),
}));

describe('Layout', () => {
  it('shows the signed-in user id in the header', () => {
    renderWithProviders(
      <Layout>
        <div>content</div>
      </Layout>
    );

    expect(
      screen.getByRole('button', { name: /open user menu.*tester/i })
    ).toHaveTextContent('tester');
  });

  it('opens the user menu from the top-right icon', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <Layout>
        <div>content</div>
      </Layout>
    );

    await user.click(screen.getByRole('button', { name: /open user menu/i }));

    expect(
      screen.getByRole('menu', { name: /User menu/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /settings/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /logout/i })
    ).toBeInTheDocument();
  });

  it('shows display name and id together inside the open menu', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <Layout>
        <div>content</div>
      </Layout>
    );

    await user.click(screen.getByRole('button', { name: /open user menu/i }));

    const menu = screen.getByRole('menu', { name: /User menu/i });
    // The display name / id header sits above the menu role, not inside it
    // (a static label is not a valid menuitem), so look at its container.
    const dropdown = menu.parentElement!;
    expect(dropdown).toHaveTextContent('Tester');
    expect(dropdown).toHaveTextContent('tester');
  });

  it('navigates to /logout without calling signOut directly', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <Layout>
        <div>content</div>
      </Layout>
    );

    await user.click(screen.getByRole('button', { name: /open user menu/i }));
    await user.click(screen.getByRole('menuitem', { name: /logout/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/logout');
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});

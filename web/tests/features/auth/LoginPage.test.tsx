import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as ReactRouterDom from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../../../src/features/auth/LoginPage';
import { authClient, signIn } from '../../../src/lib/auth-client';
import { renderWithProviders } from '../../test-utils';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof ReactRouterDom>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../src/lib/auth-client', () => ({
  authClient: {
    signIn: {
      oauth2: vi.fn(),
    },
    signOut: vi.fn(),
  },
  signIn: {
    username: vi.fn(),
  },
}));

const mockedSignInOAuth2 = vi.mocked(authClient.signIn.oauth2);
const mockedSignOut = vi.mocked(authClient.signOut);
const mockedSignInUsername = vi.mocked(signIn.username);

function setUrl(search: string) {
  window.history.pushState({}, '', `/login${search}`);
}

describe('LoginPage', () => {
  beforeEach(() => {
    mockedSignInOAuth2.mockReset();
    mockedSignOut.mockReset();
    mockedSignInUsername.mockReset();
    mockNavigate.mockReset();
    setUrl('');
  });

  it('names the identity "Kazamitte ID" on the sign-in button', () => {
    renderWithProviders(<LoginPage />);

    expect(
      screen.getByRole('button', { name: 'Kazamitte ID でログイン' })
    ).toBeInTheDocument();
  });

  it('shows a recovery action for an already-linked Kazamitte ID without naming the other account', async () => {
    const user = userEvent.setup();
    setUrl('?error=account_already_linked_to_different_user');
    mockedSignOut.mockResolvedValue({ data: null, error: null });

    renderWithProviders(<LoginPage />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'この Kazamitte ID は既に別のアカウントと連携されています。'
    );
    expect(alert.textContent).not.toMatch(/user|@|#/i);

    const signOutButton = screen.getByRole('button', {
      name: /サインアウトしてその Kazamitte ID でログインし直す/,
    });
    expect(signOutButton).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /ID とパスワードでログインする/ })
    ).toBeInTheDocument();

    await user.click(signOutButton);
    expect(mockedSignOut).toHaveBeenCalledTimes(1);
  });

  it('lets the user dismiss the already-linked error and use the password form instead', async () => {
    const user = userEvent.setup();
    setUrl('?error=account_already_linked_to_different_user');

    renderWithProviders(<LoginPage />);

    await screen.findByRole('alert');
    await user.click(
      screen.getByRole('button', { name: /ID とパスワードでログインする/ })
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not show recovery actions for other oauth error codes', async () => {
    setUrl('?error=oauth_code_verification_failed');

    renderWithProviders(<LoginPage />);

    await screen.findByRole('alert');
    expect(
      screen.queryByRole('button', { name: /サインアウトして/ })
    ).not.toBeInTheDocument();
  });
});

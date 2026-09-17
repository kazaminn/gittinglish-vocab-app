import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LogoutPage } from '../../../src/features/auth/LogoutPage';
import { useAuth } from '../../../src/hooks/useAuth';
import { authClient } from '../../../src/lib/auth-client';
import { renderWithProviders } from '../../test-utils';

vi.mock('../../../src/lib/auth-client', () => ({
  authClient: {
    listAccounts: vi.fn(),
    signOut: vi.fn(),
  },
}));

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedListAccounts = vi.mocked(authClient.listAccounts);
const mockedSignOut = vi.mocked(authClient.signOut);

function mockSignedIn(isSignedIn: boolean) {
  mockedUseAuth.mockReturnValue({
    isLoading: false,
    user: isSignedIn
      ? { id: 'u1', displayName: 'testuser', username: 'testuser' }
      : undefined,
    signOut: vi.fn(),
  });
}

const KAZAMITTE_SIGN_OUT_URL = 'https://auth.kazamitte.com/sign-out';

describe('LogoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockSignedIn(true);
    mockedSignOut.mockResolvedValue({ data: null, error: null });
    mockedListAccounts.mockResolvedValue({
      data: [{ providerId: 'credential' }],
      error: null,
    });
  });

  it('signs the user out on arrival', async () => {
    renderWithProviders(<LogoutPage />);

    await screen.findByRole('heading', { name: 'ログアウトしました' });
    expect(mockedSignOut).toHaveBeenCalledTimes(1);
  });

  it('offers the kazamitte sign-out when that identity was linked', async () => {
    mockedListAccounts.mockResolvedValue({
      data: [{ providerId: 'credential' }, { providerId: 'kazamitte' }],
      error: null,
    });

    renderWithProviders(<LogoutPage />);

    const link = await screen.findByRole('link', {
      name: 'Kazamitte ID からもログアウトする (別タブ)',
    });
    expect(link).toHaveAttribute('href', KAZAMITTE_SIGN_OUT_URL);
  });

  it('says the upstream google and github sessions survive', async () => {
    mockedListAccounts.mockResolvedValue({
      data: [{ providerId: 'kazamitte' }],
      error: null,
    });

    renderWithProviders(<LogoutPage />);

    expect(
      await screen.findByText(/Google \/ GitHub[\s\S]*のログインは残ります/)
    ).toBeInTheDocument();
  });

  it('stays quiet about kazamitte for a password-only account', async () => {
    renderWithProviders(<LogoutPage />);

    await screen.findByRole('heading', { name: 'ログアウトしました' });
    expect(
      screen.queryByRole('link', {
        name: 'Kazamitte ID からもログアウトする (別タブ)',
      })
    ).not.toBeInTheDocument();
  });

  it('offers the kazamitte sign-out when the account list cannot be read', async () => {
    mockedListAccounts.mockResolvedValue({
      data: null,
      error: { message: 'boom' },
    });

    renderWithProviders(<LogoutPage />);

    expect(
      await screen.findByRole('link', {
        name: 'Kazamitte ID からもログアウトする (別タブ)',
      })
    ).toBeInTheDocument();
  });

  it("clears this browser's copy of the user's drill data", async () => {
    // renderWithProviders wires the real localStorage-backed services, so
    // these are the keys the app itself would have written.
    localStorage.setItem('gittinglish:progress:u1', '[]');
    localStorage.setItem('gittinglish:session:u1', '{}');
    localStorage.setItem('gittinglish:progress:someone-else', '[]');

    renderWithProviders(<LogoutPage />);

    await screen.findByRole('heading', { name: 'ログアウトしました' });

    expect(localStorage.getItem('gittinglish:progress:u1')).toBeNull();
    expect(localStorage.getItem('gittinglish:session:u1')).toBeNull();
    // Only the signed-out user's rows go; nothing else in the browser does.
    expect(localStorage.getItem('gittinglish:progress:someone-else')).toBe(
      '[]'
    );
  });

  it('does not call sign-out for someone who is already signed out', async () => {
    mockSignedIn(false);

    renderWithProviders(<LogoutPage />);

    await screen.findByRole('heading', { name: 'ログアウトしました' });
    await waitFor(() => {
      expect(mockedSignOut).not.toHaveBeenCalled();
    });
    expect(mockedListAccounts).not.toHaveBeenCalled();
  });
});

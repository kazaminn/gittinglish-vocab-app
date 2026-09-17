import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsPage } from '../../src/features/settings/SettingsPage';
import { useAuth } from '../../src/hooks/useAuth';
import { authClient } from '../../src/lib/auth-client';
import { renderWithProviders } from '../test-utils';

vi.mock('../../src/lib/auth-client', () => ({
  authClient: {
    updateUser: vi.fn(),
    listAccounts: vi.fn(),
  },
}));

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUpdateUser = vi.mocked(authClient.updateUser);
const mockedListAccounts = vi.mocked(authClient.listAccounts);

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedUseAuth.mockReturnValue({
      isLoading: false,
      user: { id: 'u1', displayName: 'Kazamin', username: 'kazamin' },
      signOut: vi.fn(),
    });
    mockedUpdateUser.mockReset();
    mockedUpdateUser.mockResolvedValue({ data: null, error: null });
    mockedListAccounts.mockReset();
    mockedListAccounts.mockResolvedValue({ data: [], error: null });
  });

  it('loads the display name from the signed-in account and saves device settings locally', async () => {
    const user = userEvent.setup();

    renderWithProviders(<SettingsPage onBackToHome={vi.fn()} />);

    const displayNameInput = await screen.findByLabelText(/display name/i);
    expect(displayNameInput).toHaveValue('Kazamin');

    await user.clear(displayNameInput);
    await user.type(displayNameInput, 'Mikan');
    await user.click(screen.getByRole('button', { name: /dark/i }));
    await user.click(screen.getByRole('button', { name: /> save settings/i }));

    await waitFor(() => {
      const raw = localStorage.getItem('gittinglish:settings');
      expect(raw).not.toBeNull();

      const parsed = JSON.parse(raw ?? '{}') as {
        displayName?: string;
        theme?: string;
      };

      expect(parsed.displayName).toBeUndefined();
      expect(parsed.theme).toBe('dark');
    });
  });

  it('saves the display name to the account via updateUser', async () => {
    const user = userEvent.setup();

    renderWithProviders(<SettingsPage onBackToHome={vi.fn()} />);

    const displayNameInput = await screen.findByLabelText(/display name/i);
    await user.clear(displayNameInput);
    await user.type(displayNameInput, 'Mikan');
    await user.click(screen.getByRole('button', { name: /> save settings/i }));

    await waitFor(() => {
      expect(mockedUpdateUser).toHaveBeenCalledWith({ name: 'Mikan' });
    });
  });

  it('falls back to the ID when the display name is cleared', async () => {
    const user = userEvent.setup();

    renderWithProviders(<SettingsPage onBackToHome={vi.fn()} />);

    const displayNameInput = await screen.findByLabelText(/display name/i);
    await user.clear(displayNameInput);
    await user.type(displayNameInput, '   ');
    await user.click(screen.getByRole('button', { name: /> save settings/i }));

    await waitFor(() => {
      expect(mockedUpdateUser).toHaveBeenCalledWith({ name: 'kazamin' });
    });
    expect(displayNameInput).toHaveValue('kazamin');
  });

  it('surfaces an updateUser failure instead of silently saving', async () => {
    const user = userEvent.setup();
    mockedUpdateUser.mockResolvedValue({
      data: null,
      error: { code: 'UNKNOWN', message: 'network error' },
    });

    renderWithProviders(<SettingsPage onBackToHome={vi.fn()} />);

    const displayNameInput = await screen.findByLabelText(/display name/i);
    await user.clear(displayNameInput);
    await user.type(displayNameInput, 'Mikan');
    await user.click(screen.getByRole('button', { name: /> save settings/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('network error');
    expect(localStorage.getItem('gittinglish:settings')).toBeNull();
  });

  it('does not resurrect a stale displayName saved under the old settings schema', async () => {
    localStorage.setItem(
      'gittinglish:settings',
      JSON.stringify({
        displayName: 'ghost of a previous user',
        fontSize: 18,
        fontWeight: 500,
        theme: 'dark',
        sessionSize: 30,
      })
    );

    renderWithProviders(<SettingsPage onBackToHome={vi.fn()} />);

    const displayNameInput = await screen.findByLabelText(/display name/i);
    // The field reflects the signed-in account, never the stale local value.
    expect(displayNameInput).toHaveValue('Kazamin');
    expect(
      screen.queryByText(/ghost of a previous user/i)
    ).not.toBeInTheDocument();
  });
});

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as ReactRouterDom from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KazamitteLinkSection } from '../../../src/features/settings/KazamitteLinkSection';
import { authClient } from '../../../src/lib/auth-client';
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
    listAccounts: vi.fn(),
    unlinkAccount: vi.fn(),
    signOut: vi.fn(),
    oauth2: {
      link: vi.fn(),
    },
  },
}));

const mockedListAccounts = vi.mocked(authClient.listAccounts);
const mockedUnlinkAccount = vi.mocked(authClient.unlinkAccount);
const mockedSignOut = vi.mocked(authClient.signOut);

function setUrl(search: string) {
  window.history.pushState({}, '', `/app/settings${search}`);
}

describe('KazamitteLinkSection', () => {
  beforeEach(() => {
    mockedListAccounts.mockReset();
    mockedUnlinkAccount.mockReset();
    mockedSignOut.mockReset();
    mockNavigate.mockReset();
    setUrl('');
  });

  afterEach(() => {
    setUrl('');
  });

  it('gates the unlink call behind a confirmation step', async () => {
    const user = userEvent.setup();
    mockedListAccounts.mockResolvedValue({
      data: [
        { providerId: 'credential', accountId: 'cred-1' },
        { providerId: 'kazamitte', accountId: 'kaz-1' },
      ],
      error: null,
    });

    renderWithProviders(<KazamitteLinkSection />);

    const unlinkButton = await screen.findByRole('button', {
      name: /unlink kazamitte id/i,
    });

    // Not confirming yet: no call should happen from merely opening it.
    expect(mockedUnlinkAccount).not.toHaveBeenCalled();

    await user.click(unlinkButton);
    expect(
      screen.getByText(/unlink kazamitte id\? you will need/i)
    ).toBeInTheDocument();
    expect(mockedUnlinkAccount).not.toHaveBeenCalled();

    // Cancelling must not call the API either.
    await user.click(screen.getByRole('button', { name: 'cancel' }));
    expect(
      screen.queryByText(/unlink kazamitte id\? you will need/i)
    ).not.toBeInTheDocument();
    expect(mockedUnlinkAccount).not.toHaveBeenCalled();

    mockedUnlinkAccount.mockResolvedValue({
      data: { status: true },
      error: null,
    });

    await user.click(
      screen.getByRole('button', { name: /unlink kazamitte id/i })
    );
    await user.click(screen.getByRole('button', { name: /yes, unlink it/i }));

    expect(mockedUnlinkAccount).toHaveBeenCalledTimes(1);
    expect(mockedUnlinkAccount).toHaveBeenCalledWith({
      providerId: 'kazamitte',
      accountId: 'kaz-1',
    });
  });

  it('refreshes the linked-accounts list after a successful unlink', async () => {
    const user = userEvent.setup();
    mockedListAccounts
      .mockResolvedValueOnce({
        data: [
          { providerId: 'credential', accountId: 'cred-1' },
          { providerId: 'kazamitte', accountId: 'kaz-1' },
        ],
        error: null,
      })
      .mockResolvedValue({
        data: [{ providerId: 'credential', accountId: 'cred-1' }],
        error: null,
      });
    mockedUnlinkAccount.mockResolvedValue({
      data: { status: true },
      error: null,
    });

    renderWithProviders(<KazamitteLinkSection />);

    await screen.findByText(/linked\. you can sign in with your kazamitte id/i);

    await user.click(
      await screen.findByRole('button', { name: /unlink kazamitte id/i })
    );
    await user.click(screen.getByRole('button', { name: /yes, unlink it/i }));

    await waitFor(() => expect(mockedListAccounts).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByText(/not linked\. link your kazamitte id/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /link kazamitte id/i })
    ).toBeInTheDocument();
  });

  it('shows the required message when unlinking the last login method is refused', async () => {
    const user = userEvent.setup();
    mockedListAccounts.mockResolvedValue({
      data: [{ providerId: 'kazamitte', accountId: 'kaz-1' }],
      error: null,
    });
    mockedUnlinkAccount.mockResolvedValue({
      data: null,
      error: {
        code: 'FAILED_TO_UNLINK_LAST_ACCOUNT',
        message: "You can't unlink your last account",
      },
    });

    renderWithProviders(<KazamitteLinkSection />);

    // Told up front, before ever attempting the call.
    expect(
      await screen.findByText(/this is your only login method/i)
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /unlink kazamitte id/i })
    );
    await user.click(screen.getByRole('button', { name: /yes, unlink it/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Kazamitte ID は現在唯一のログイン方法です。連携を解除するには、先にパスワードを設定してください。'
    );
  });

  it('offers a recovery action for an already-linked Kazamitte ID without naming the other account', async () => {
    const user = userEvent.setup();
    setUrl('?error=account_already_linked_to_different_user');
    mockedListAccounts.mockResolvedValue({
      data: [{ providerId: 'credential', accountId: 'cred-1' }],
      error: null,
    });

    renderWithProviders(<KazamitteLinkSection />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'この Kazamitte ID は既に別のアカウントと連携されています。'
    );
    // No account identifier, id, or name leaks into the message.
    expect(alert.textContent).not.toMatch(/user|@|#/i);

    const signOutButton = screen.getByRole('button', {
      name: /サインアウトしてその Kazamitte ID でログインする/,
    });
    const keepButton = screen.getByRole('button', {
      name: /このまま今のアカウントを使う/,
    });
    expect(signOutButton).toBeInTheDocument();
    expect(keepButton).toBeInTheDocument();

    await user.click(signOutButton);
    expect(mockedSignOut).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('lets the user dismiss the already-linked error and keep their current account', async () => {
    const user = userEvent.setup();
    setUrl('?error=account_already_linked_to_different_user');
    mockedListAccounts.mockResolvedValue({
      data: [{ providerId: 'credential', accountId: 'cred-1' }],
      error: null,
    });

    renderWithProviders(<KazamitteLinkSection />);

    await screen.findByRole('alert');
    await user.click(
      screen.getByRole('button', {
        name: /このまま今のアカウントを使う/,
      })
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mockedSignOut).not.toHaveBeenCalled();
  });
});

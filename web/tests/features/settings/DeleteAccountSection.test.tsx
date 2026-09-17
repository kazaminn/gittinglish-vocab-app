import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as ReactRouterDom from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteAccountSection } from '../../../src/features/settings/DeleteAccountSection';
import { useAuth } from '../../../src/hooks/useAuth';
import type * as ApiClientModule from '../../../src/lib/api-client';
import { ApiClientError, apiRequest } from '../../../src/lib/api-client';
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

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../src/lib/auth-client', () => ({
  authClient: {
    signOut: vi.fn(),
  },
}));

vi.mock('../../../src/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiClientModule>();
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

const mockedUseAuth = vi.mocked(useAuth);
const mockedSignOut = vi.mocked(authClient.signOut);
const mockedApiRequest = vi.mocked(apiRequest);

describe('DeleteAccountSection', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockedSignOut.mockReset();
    mockedApiRequest.mockReset();
    mockedUseAuth.mockReturnValue({
      isLoading: false,
      user: { id: 'u1', displayName: 'Kazamin', username: 'kazamin' },
      signOut: vi.fn(),
    });
  });

  it('does not call the API until the typed id matches', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeleteAccountSection />);

    await user.click(screen.getByRole('button', { name: /^> delete account/ }));

    const confirmButton = screen.getByRole('button', {
      name: /yes, delete my account/,
    });
    expect(confirmButton).toBeDisabled();

    const input = screen.getByLabelText('confirm account id');
    await user.type(input, 'wrong-id');
    expect(confirmButton).toBeDisabled();
    expect(mockedApiRequest).not.toHaveBeenCalled();

    await user.clear(input);
    await user.type(input, 'kazamin');
    expect(confirmButton).toBeEnabled();
  });

  it('deletes the account and signs out on a matching confirmation', async () => {
    const user = userEvent.setup();
    mockedApiRequest.mockResolvedValue({ success: true });
    mockedSignOut.mockResolvedValue(undefined);

    renderWithProviders(<DeleteAccountSection />);

    await user.click(screen.getByRole('button', { name: /^> delete account/ }));
    await user.type(screen.getByLabelText('confirm account id'), 'kazamin');
    await user.click(
      screen.getByRole('button', { name: /yes, delete my account/ })
    );

    expect(mockedApiRequest).toHaveBeenCalledWith('/api/users/me', {
      method: 'DELETE',
      body: JSON.stringify({ confirmUsername: 'kazamin' }),
    });
    await waitFor(() => expect(mockedSignOut).toHaveBeenCalledTimes(1));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('cancelling clears the confirmation state without calling the API', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeleteAccountSection />);

    await user.click(screen.getByRole('button', { name: /^> delete account/ }));
    await user.type(screen.getByLabelText('confirm account id'), 'kazamin');
    await user.click(screen.getByRole('button', { name: 'cancel' }));

    expect(
      screen.queryByLabelText('confirm account id')
    ).not.toBeInTheDocument();
    expect(mockedApiRequest).not.toHaveBeenCalled();
  });

  it('shows a Japanese error and does not sign out when the server rejects the request', async () => {
    const user = userEvent.setup();
    mockedApiRequest.mockRejectedValue(
      new ApiClientError(
        'Confirmation did not match your account ID',
        'CONFIRMATION_MISMATCH',
        400
      )
    );

    renderWithProviders(<DeleteAccountSection />);

    await user.click(screen.getByRole('button', { name: /^> delete account/ }));
    await user.type(screen.getByLabelText('confirm account id'), 'kazamin');
    await user.click(
      screen.getByRole('button', { name: /yes, delete my account/ })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '入力した ID が一致しませんでした。'
    );
    expect(mockedSignOut).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PasswordSection } from '../../../src/features/settings/PasswordSection';
import type * as ApiClientModule from '../../../src/lib/api-client';
import { ApiClientError, apiRequest } from '../../../src/lib/api-client';
import { authClient } from '../../../src/lib/auth-client';
import { renderWithProviders } from '../../test-utils';

vi.mock('../../../src/lib/auth-client', () => ({
  authClient: {
    listAccounts: vi.fn(),
  },
}));

vi.mock('../../../src/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiClientModule>();
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

const mockedListAccounts = vi.mocked(authClient.listAccounts);
const mockedApiRequest = vi.mocked(apiRequest);

describe('PasswordSection', () => {
  beforeEach(() => {
    mockedListAccounts.mockReset();
    mockedApiRequest.mockReset();
  });

  it('does not offer the form when a password is already set', async () => {
    mockedListAccounts.mockResolvedValue({
      data: [{ providerId: 'credential' }],
      error: null,
    });

    renderWithProviders(<PasswordSection />);

    expect(
      await screen.findByText(
        'password set. you can sign in with your id and password.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('new password')).not.toBeInTheDocument();
  });

  it('lets a Kazamitte-only user set a password', async () => {
    const user = userEvent.setup();
    mockedListAccounts.mockResolvedValue({
      data: [{ providerId: 'kazamitte' }],
      error: null,
    });
    mockedApiRequest.mockResolvedValue({ success: true });

    renderWithProviders(<PasswordSection />);

    const passwordInput = await screen.findByLabelText('new password');
    const submitButton = screen.getByRole('button', {
      name: /set password/,
    });
    expect(submitButton).toBeDisabled();

    await user.type(passwordInput, 'password123');
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    expect(
      await screen.findByText(
        'password set. you can sign in with your id and password.'
      )
    ).toBeInTheDocument();
    expect(mockedApiRequest).toHaveBeenCalledWith('/api/users/password', {
      method: 'POST',
      body: JSON.stringify({ newPassword: 'password123' }),
    });
    expect(screen.queryByLabelText('new password')).not.toBeInTheDocument();
  });

  it('shows a message when the account already has a password', async () => {
    const user = userEvent.setup();
    mockedListAccounts.mockResolvedValue({
      data: [{ providerId: 'kazamitte' }],
      error: null,
    });
    mockedApiRequest.mockRejectedValue(
      new ApiClientError(
        'User already has a password set',
        'PASSWORD_ALREADY_SET',
        409
      )
    );

    renderWithProviders(<PasswordSection />);

    const passwordInput = await screen.findByLabelText('new password');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: /set password/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'このアカウントには既にパスワードが設定されています。'
    );
  });
});

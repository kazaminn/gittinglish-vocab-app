import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SetupPage } from '../../../src/features/auth/SetupPage';
import { useAuth } from '../../../src/hooks/useAuth';
import { authClient } from '../../../src/lib/auth-client';
import { renderWithProviders } from '../../test-utils';

vi.mock('../../../src/lib/auth-client', () => ({
  authClient: {
    updateUser: vi.fn(),
  },
}));

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUpdateUser = vi.mocked(authClient.updateUser);

function mockSignedInUser(username: string | undefined) {
  mockedUseAuth.mockReturnValue({
    isLoading: false,
    user: {
      id: 'u1',
      displayName: '3f1a9c2e-6b7d-4e5f-9a1b-0c2d3e4f5a6b',
      username,
    },
    signOut: vi.fn(),
  });
}

describe('SetupPage', () => {
  beforeEach(() => {
    mockSignedInUser(undefined);
    mockedUpdateUser.mockReset();
    mockedUpdateUser.mockResolvedValue({ data: null, error: null });
  });

  it('submits the chosen ID', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SetupPage />);

    await user.type(screen.getByLabelText(/^ID/), 'kazamin');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: '設定して始める' }));

    expect(mockedUpdateUser).toHaveBeenCalledTimes(1);
    expect(mockedUpdateUser).toHaveBeenCalledWith({
      username: 'kazamin',
      displayUsername: 'kazamin',
      name: 'kazamin',
    });
  });

  it('lets the display name override the name field', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SetupPage />);

    await user.type(screen.getByLabelText(/^ID/), 'kazamin');
    await user.type(screen.getByLabelText(/表示名/), 'カザミン');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: '設定して始める' }));

    expect(mockedUpdateUser).toHaveBeenCalledWith({
      username: 'kazamin',
      displayUsername: 'kazamin',
      name: 'カザミン',
    });
  });

  it('blocks submit until the ID and terms checkbox are both valid', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SetupPage />);

    const idInput = screen.getByLabelText(/^ID/);
    const checkbox = screen.getByRole('checkbox');
    const submitButton = screen.getByRole('button', {
      name: '設定して始める',
    });

    // Terms unchecked, no ID yet.
    expect(submitButton).toBeDisabled();

    // ID too short.
    await user.type(idInput, 'ka');
    await user.click(checkbox);
    expect(submitButton).toBeDisabled();

    // ID with a disallowed ASCII character.
    await user.clear(idInput);
    await user.type(idInput, 'kaza-min');
    expect(submitButton).toBeDisabled();

    // ID with a disallowed non-ASCII character.
    await user.clear(idInput);
    await user.type(idInput, 'かざみん');
    expect(submitButton).toBeDisabled();

    // Valid ID, terms still checked from earlier.
    await user.clear(idInput);
    await user.type(idInput, 'kazamin');
    expect(submitButton).toBeEnabled();

    // Unchecking terms disables it again.
    await user.click(checkbox);
    expect(submitButton).toBeDisabled();
  });

  it('shows a Japanese message when the ID is already taken', async () => {
    const user = userEvent.setup();
    mockedUpdateUser.mockResolvedValue({
      data: null,
      error: {
        code: 'USERNAME_IS_ALREADY_TAKEN',
        message: 'Username is already taken. Please try another.',
      },
    });

    renderWithProviders(<SetupPage />);

    await user.type(screen.getByLabelText(/^ID/), 'kazamin');
    await user.click(screen.getByRole('checkbox'));
    const submitButton = screen.getByRole('button', {
      name: '設定して始める',
    });
    await user.click(submitButton);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'この ID は既に使われています。'
    );
    expect(submitButton).toBeEnabled();
    expect(submitButton).toHaveTextContent('設定して始める');
  });

  it('never shows the form to a user who already has an ID', () => {
    mockSignedInUser('testuser');

    renderWithProviders(<SetupPage />);

    expect(screen.queryByLabelText(/^ID/)).not.toBeInTheDocument();
  });
});

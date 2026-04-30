import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SettingsPage } from '../../src/features/settings/SettingsPage';
import { renderWithProviders } from '../test-utils';

describe('SettingsPage', () => {
  it('loads and saves user settings', async () => {
    const user = userEvent.setup();

    renderWithProviders(<SettingsPage onBackToHome={vi.fn()} />);

    const displayNameInput = await screen.findByLabelText(/display name/i);
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

      expect(parsed.displayName).toBe('Mikan');
      expect(parsed.theme).toBe('dark');
    });
  });
});

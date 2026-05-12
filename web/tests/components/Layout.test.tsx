import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Layout } from '../../src/components/Layout';
import { renderWithProviders } from '../test-utils';

describe('Layout', () => {
  it('opens the user menu from the top-right icon', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <Layout>
        <div>content</div>
      </Layout>
    );

    await user.click(screen.getByRole('button', { name: /Open user menu/i }));

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
});

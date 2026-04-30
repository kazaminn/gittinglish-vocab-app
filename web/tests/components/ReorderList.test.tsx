import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReorderList } from '../../src/components/ReorderList';
import { renderWithProviders } from '../test-utils';

describe('ReorderList', () => {
  it('swaps two selected chunks before submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(
      <ReorderList
        chunks={[
          { id: 'a', text: 'alpha' },
          { id: 'b', text: 'beta' },
        ]}
        onSubmit={onSubmit}
        disabled={false}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /Answer slot 1: empty/i })
    );
    await user.click(
      screen.getByRole('button', { name: /Chunk choice: alpha/i })
    );
    await user.click(
      screen.getByRole('button', { name: /Answer slot 1: alpha/i })
    );
    await user.click(
      screen.getByRole('button', { name: /Chunk choice: beta/i })
    );
    await user.click(
      screen.getByRole('button', { name: /Answer slot 2: empty/i })
    );
    await user.click(
      screen.getByRole('button', { name: /Chunk choice: alpha/i })
    );
    await user.click(screen.getByRole('button', { name: /> submit order/i }));

    expect(onSubmit).toHaveBeenCalledWith(['b', 'a']);
  });
});

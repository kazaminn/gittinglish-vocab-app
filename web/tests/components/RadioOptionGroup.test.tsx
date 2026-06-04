import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { RadioOptionGroup } from '../../src/components/RadioOptionGroup';

interface Item {
  id: string;
  label: string;
}

const ITEMS: Item[] = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta' },
  { id: 'c', label: 'Gamma' },
];

function Harness({
  numberKeys = false,
  autoFocusFirst = false,
}: {
  numberKeys?: boolean;
  autoFocusFirst?: boolean;
}) {
  const [selected, setSelected] = useState('a');
  return (
    <RadioOptionGroup
      ariaLabel="Test group"
      items={ITEMS}
      getKey={(item) => item.id}
      renderLabel={(item) => item.label}
      selectedKey={selected}
      onSelect={(item) => setSelected(item.id)}
      numberKeys={numberKeys}
      autoFocusFirst={autoFocusFirst}
    />
  );
}

describe('RadioOptionGroup', () => {
  it('marks the selected option with aria-checked', () => {
    render(<Harness />);
    expect(screen.getByRole('radiogroup', { name: 'Test group' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Alpha' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByRole('radio', { name: 'Beta' })).toHaveAttribute(
      'aria-checked',
      'false'
    );
  });

  it('moves focus with arrow keys and selects with Enter', async () => {
    const user = userEvent.setup();
    render(<Harness autoFocusFirst />);

    expect(screen.getByRole('radio', { name: 'Alpha' })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Beta' })).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(screen.getByRole('radio', { name: 'Beta' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  it('wraps focus from the last option back to the first', async () => {
    const user = userEvent.setup();
    render(<Harness autoFocusFirst />);

    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('radio', { name: 'Gamma' })).toHaveFocus();
  });

  it('selects directly with number keys when enabled', async () => {
    const user = userEvent.setup();
    render(<Harness numberKeys autoFocusFirst />);

    await user.keyboard('3');
    expect(screen.getByRole('radio', { name: 'Gamma' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });
});

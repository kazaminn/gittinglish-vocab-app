import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SelectableOption } from '../../src/components/SelectableOption';

describe('SelectableOption', () => {
  it('applies the variant class for its state', () => {
    render(<SelectableOption state="correct">answer</SelectableOption>);
    expect(screen.getByRole('button', { name: 'answer' }).className).toContain(
      'bg-success-surface'
    );
  });

  it('forwards its ref to the underlying button', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <SelectableOption ref={ref} state="selected">
        x
      </SelectableOption>
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('renders the indicator before the label', () => {
    render(<SelectableOption indicator="[1]">choice</SelectableOption>);
    expect(screen.getByRole('button').textContent).toBe('[1]choice');
  });
});

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { tv } from '../lib/tv';

export type OptionState = 'default' | 'selected' | 'correct' | 'incorrect';

const selectableOption = tv({
  base: 'w-full rounded-sm border text-left',
  variants: {
    state: {
      default: 'border-border bg-transparent text-primary',
      selected: 'border-edge-accent bg-selected text-primary',
      correct: 'border-border-success bg-success-surface text-success',
      incorrect: 'border-border-error bg-error-surface text-error',
    },
    density: {
      compact: 'px-4 py-2 text-sm',
      comfortable: 'px-4 py-3',
    },
  },
  defaultVariants: {
    state: 'default',
    density: 'compact',
  },
});

interface SelectableOptionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  state?: OptionState;
  density?: 'compact' | 'comfortable';
  indicator?: ReactNode;
}

export const SelectableOption = forwardRef<
  HTMLButtonElement,
  SelectableOptionProps
>(({ state, density, indicator, className, children, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={selectableOption({ state, density, className })}
    {...props}
  >
    {indicator !== undefined && (
      <span className="mr-2 text-muted">{indicator}</span>
    )}
    {children}
  </button>
));

SelectableOption.displayName = 'SelectableOption';

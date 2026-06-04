import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react';
import { tv } from '../lib/tv';

export type OptionState = 'default' | 'selected' | 'correct' | 'incorrect';

const selectableOption = tv({
  base: 'w-full rounded-sm border text-left',
  variants: {
    state: {
      default: 'bg-transparent border-border text-primary',
      selected: 'bg-selected border-edge-accent text-primary',
      correct: 'bg-success-surface border-border-success text-success',
      incorrect: 'bg-error-surface border-border-error text-error',
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

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { tv } from '../lib/tv';

const buttonVariants = tv({
  base: [
    'inline-flex items-center justify-center',
    'rounded-md px-4 py-2',
    'font-medium text-sm',
    'transition-colors duration-150',
    'disabled:opacity-50 disabled:pointer-events-none',
    'cursor-pointer',
  ],
  variants: {
    variant: {
      primary: 'bg-accent text-text-inverted hover:bg-accent-hover',
      secondary: 'bg-bg-muted text-text border border-border hover:bg-bg-hover',
      ghost: 'text-text-muted hover:bg-bg-muted hover:text-text',
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
});

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, className, ...props }, ref) => (
    <button
      type="button"
      ref={ref}
      className={buttonVariants({ variant, className })}
      {...props}
    />
  )
);

Button.displayName = 'Button';

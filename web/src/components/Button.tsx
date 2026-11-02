import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { tv } from '../lib/tv';

const buttonVariants = tv({
  base: [
    'inline-flex items-center rounded-sm border text-left',
    'transition-colors duration-150',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  variants: {
    variant: {
      primary: 'border-transparent bg-accent text-white hover:bg-accent/90',
      outline: 'border-edge-accent bg-transparent text-accent-fg',
      secondary: 'border-border bg-transparent text-primary',
      ghost: 'border-transparent bg-transparent text-muted hover:bg-elevated',
    },
    size: {
      sm: 'px-4 py-2 text-sm',
      md: 'px-4 py-3',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, fullWidth = false, className, ...props }, ref) => (
    <button
      type="button"
      ref={ref}
      className={buttonVariants({
        variant,
        size,
        className:
          [fullWidth && 'w-full', className].filter(Boolean).join(' ') ||
          undefined,
      })}
      {...props}
    />
  ),
);

Button.displayName = 'Button';

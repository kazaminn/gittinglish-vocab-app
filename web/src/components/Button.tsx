import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { tv } from '../lib/tv';

const buttonVariants = tv({
  base: [
    'inline-flex items-center rounded-sm border text-left',
    'transition-colors duration-150',
    'disabled:opacity-50 disabled:pointer-events-none',
  ],
  variants: {
    variant: {
      primary: 'bg-accent border-transparent text-white hover:bg-accent/90',
      outline: 'bg-transparent border-edge-accent text-accent-fg',
      secondary: 'bg-transparent border-border text-primary',
      ghost: 'bg-transparent border-transparent text-muted hover:bg-elevated',
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
  )
);

Button.displayName = 'Button';

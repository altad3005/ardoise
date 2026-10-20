import type { ButtonHTMLAttributes } from 'react';
import { classNames } from './class-names.ts';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export const buttonBaseClassName =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-base font-semibold disabled:opacity-60';

const variantClassNames: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-page hover:bg-ink/90',
  secondary: 'border border-field text-ink hover:bg-surface-raised',
  ghost: 'text-ink-muted hover:bg-surface-raised hover:text-ink',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isPending?: boolean;
}

export function Button({
  variant = 'primary',
  isPending = false,
  type = 'button',
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isPending}
      aria-busy={isPending || undefined}
      className={classNames(buttonBaseClassName, variantClassNames[variant], className)}
      {...props}
    />
  );
}

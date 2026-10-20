import type { ButtonHTMLAttributes } from 'react';
import { buttonBaseClassName } from './button.tsx';
import { classNames } from './class-names.ts';

interface ToggleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isSelected: boolean;
}

export function ToggleButton({
  isSelected,
  type = 'button',
  className,
  ...props
}: ToggleButtonProps) {
  return (
    <button
      type={type}
      aria-pressed={isSelected}
      className={classNames(
        buttonBaseClassName,
        'border border-field text-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-page',
        className,
      )}
      {...props}
    />
  );
}

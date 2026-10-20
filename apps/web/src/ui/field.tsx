import type { ReactNode } from 'react';
import { classNames } from './class-names.ts';

export interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
}

export const fieldControlClassName =
  'min-h-11 w-full min-w-0 rounded-md border border-field bg-surface px-3 text-base text-ink aria-invalid:border-danger';

export function fieldControlProps(id: string, error?: string | null, hint?: string) {
  return {
    id,
    'aria-invalid': Boolean(error),
    'aria-describedby': (error ?? hint) ? descriptionId(id) : undefined,
  };
}

export function Field({ id, label, hint, error, children }: FieldProps & { children: ReactNode }) {
  const description = error ?? hint;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      {children}
      {description && (
        <p
          id={descriptionId(id)}
          className={classNames('mt-1 text-sm', error ? 'text-danger' : 'text-ink-muted')}
        >
          {description}
        </p>
      )}
    </div>
  );
}

function descriptionId(id: string): string {
  return `${id}-description`;
}

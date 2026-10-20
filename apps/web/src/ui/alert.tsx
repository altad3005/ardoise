import type { ReactNode } from 'react';
import { classNames } from './class-names.ts';

type AlertTone = 'danger' | 'success';

const toneClassNames: Record<AlertTone, string> = {
  danger: 'bg-danger-soft text-danger',
  success: 'bg-success-soft text-success',
};

export function Alert({ tone = 'danger', children }: { tone?: AlertTone; children: ReactNode }) {
  return (
    <p role="alert" className={classNames('rounded-md px-3 py-2 text-sm', toneClassNames[tone])}>
      {children}
    </p>
  );
}

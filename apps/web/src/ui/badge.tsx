import type { ReactNode } from 'react';
import { classNames } from './class-names.ts';

type BadgeTone = 'neutral' | 'accent';

const toneClassNames: Record<BadgeTone, string> = {
  neutral: 'bg-surface-raised text-ink-muted',
  accent: 'bg-accent-soft text-accent',
};

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={classNames('rounded-full px-2 py-0.5 text-xs font-semibold', toneClassNames[tone])}
    >
      {children}
    </span>
  );
}

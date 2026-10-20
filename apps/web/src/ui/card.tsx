import type { HTMLAttributes } from 'react';
import { classNames } from './class-names.ts';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={classNames('rounded-xl border border-line bg-surface', className)} {...props} />
  );
}

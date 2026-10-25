import type { TreasuryAccount } from '@ardoise/types';
import type { ReactNode } from 'react';
import { formatPrice } from '../forms/number-format.ts';
import { Badge } from '../ui/badge.tsx';
import { Card } from '../ui/card.tsx';
import { classNames } from '../ui/class-names.ts';
import { EditButton } from '../ui/edit-button.tsx';
import { accountTypeLabels } from './account-type-labels.ts';

interface AccountCardProps {
  account: TreasuryAccount;
  isSelected: boolean;
  onEdit: () => void;
  children?: ReactNode;
}

export function AccountCard({ account, isSelected, onEdit, children }: AccountCardProps) {
  const headingId = `account-${account.id}`;
  return (
    <article aria-labelledby={headingId}>
      <Card className="overflow-hidden">
        <div className={classNames('flex flex-col gap-1 p-4', isSelected && 'bg-accent-soft')}>
          <div className="flex items-center gap-2">
            <Badge tone={account.type === 'CASH' ? 'accent' : 'neutral'}>
              {accountTypeLabels[account.type]}
            </Badge>
            <EditButton
              itemName={account.name}
              aria-expanded={isSelected}
              className="ml-auto"
              onClick={onEdit}
            />
          </div>
          <h2 id={headingId} className="mt-1 text-lg font-bold">
            {account.name}
          </h2>
          <p
            className={classNames(
              'font-display text-3xl font-bold',
              account.balanceCents < 0 && 'text-accent',
            )}
          >
            {formatPrice(account.balanceCents)}
          </p>
          <p className="text-sm text-ink-muted">
            ouvert à {formatPrice(account.openingBalanceCents)}
          </p>
        </div>
        {children && <div className="border-t border-line p-4">{children}</div>}
      </Card>
    </article>
  );
}

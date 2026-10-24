import type { TreasuryAccount } from '@ardoise/types';
import { formatPrice } from '../forms/number-format.ts';
import { Badge } from '../ui/badge.tsx';
import { Button } from '../ui/button.tsx';
import { Card } from '../ui/card.tsx';
import { classNames } from '../ui/class-names.ts';
import { accountTypeLabels } from './account-type-labels.ts';

interface AccountCardProps {
  account: TreasuryAccount;
  onEdit: () => void;
}

export function AccountCard({ account, onEdit }: AccountCardProps) {
  const headingId = `account-${account.id}`;
  return (
    <article aria-labelledby={headingId}>
      <Card className="flex flex-col gap-1 p-4">
        <div className="flex items-center gap-2">
          <Badge tone={account.type === 'CASH' ? 'accent' : 'neutral'}>
            {accountTypeLabels[account.type]}
          </Badge>
          <Button variant="secondary" className="ml-auto" onClick={onEdit}>
            Modifier
          </Button>
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
      </Card>
    </article>
  );
}

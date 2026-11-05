import type { TreasuryAccount } from '@ardoise/types';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { fetchAccounts } from '../api/accounts.ts';
import { Alert } from '../ui/alert.tsx';
import { Button } from '../ui/button.tsx';
import { Card } from '../ui/card.tsx';
import { PageHeader } from '../ui/page-header.tsx';
import { useMediaQuery } from '../ui/use-media-query.ts';
import { AccountCard } from './account-card.tsx';
import { AccountForm } from './account-form.tsx';
import { accountsQueryKey } from './accounts-query-key.ts';

export function AccountsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [editedAccountId, setEditedAccountId] = useState<string | null>(null);
  const isWide = useMediaQuery('(min-width: 64rem)');
  const accounts = useQuery({ queryKey: accountsQueryKey, queryFn: fetchAccounts });

  const startCreating = () => {
    setEditedAccountId(null);
    setIsCreating(true);
  };
  const toggleEditing = (account: TreasuryAccount) => {
    setIsCreating(false);
    setEditedAccountId(account.id === editedAccountId ? null : account.id);
  };
  const stopEditing = () => setEditedAccountId(null);

  const hasAccounts = (accounts.data?.length ?? 0) > 0;
  const header = (
    <PageHeader
      title="Comptes"
      subtitle="Les comptes bancaires et les caisses en espèces de l'association."
      actions={
        hasAccounts && (
          <Button onClick={startCreating} disabled={isCreating}>
            Nouveau compte
          </Button>
        )
      }
    />
  );

  if (accounts.isPending) {
    return (
      <section>
        {header}
        <p className="text-ink-muted">Chargement des comptes…</p>
      </section>
    );
  }
  if (accounts.isError) {
    return (
      <section>
        {header}
        <Alert>Impossible de charger les comptes, réessayez plus tard</Alert>
      </section>
    );
  }

  const editedAccount = accounts.data.find((account) => account.id === editedAccountId);

  return (
    <section>
      {header}
      {(isCreating || !hasAccounts) && (
        <Card className="mb-6 p-4">
          <h2 className="mb-4 font-display text-xl font-bold">Nouveau compte</h2>
          <AccountForm
            onDone={() => setIsCreating(false)}
            onCancel={hasAccounts ? () => setIsCreating(false) : undefined}
          />
        </Card>
      )}
      {!hasAccounts ? (
        <p className="text-ink-muted">
          Aucun compte. Déclare au moins une caisse pour pouvoir ouvrir une soirée.
        </p>
      ) : (
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-6">
          <ul className="grid gap-4 sm:grid-cols-2">
            {accounts.data.map((account) => {
              const isSelected = account.id === editedAccountId;
              return (
                <li key={account.id}>
                  <AccountCard
                    account={account}
                    isSelected={isSelected}
                    onEdit={() => toggleEditing(account)}
                  >
                    {isSelected && !isWide && (
                      <AccountForm account={account} onDone={stopEditing} onCancel={stopEditing} />
                    )}
                  </AccountCard>
                </li>
              );
            })}
          </ul>
          {isWide && editedAccount && (
            <Card className="sticky top-6 p-4">
              <h2 className="mb-4 font-display text-xl font-bold">Modifier {editedAccount.name}</h2>
              <AccountForm
                key={editedAccount.id}
                account={editedAccount}
                onDone={stopEditing}
                onCancel={stopEditing}
              />
            </Card>
          )}
        </div>
      )}
    </section>
  );
}

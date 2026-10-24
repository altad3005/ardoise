import type { TreasuryAccount } from '@ardoise/types';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { fetchAccounts } from '../api/accounts.ts';
import { Alert } from '../ui/alert.tsx';
import { Card } from '../ui/card.tsx';
import { PageHeader } from '../ui/page-header.tsx';
import { AccountCard } from './account-card.tsx';
import { AccountForm } from './account-form.tsx';
import { accountsQueryKey } from './accounts-query-key.ts';

export function AccountsPage() {
  const [editedAccount, setEditedAccount] = useState<TreasuryAccount | null>(null);
  const accounts = useQuery({ queryKey: accountsQueryKey, queryFn: fetchAccounts });

  return (
    <section>
      <PageHeader
        title="Comptes"
        subtitle="Les comptes bancaires et les caisses en espèces de l'association."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <AccountList
          accounts={accounts.data}
          isPending={accounts.isPending}
          isError={accounts.isError}
          onEdit={setEditedAccount}
        />
        <Card className="p-4">
          <h2 className="mb-4 font-display text-xl font-bold">
            {editedAccount ? `Modifier ${editedAccount.name}` : 'Nouveau compte'}
          </h2>
          <AccountForm
            key={editedAccount?.id ?? 'new'}
            account={editedAccount ?? undefined}
            onDone={() => setEditedAccount(null)}
          />
        </Card>
      </div>
    </section>
  );
}

interface AccountListProps {
  accounts: TreasuryAccount[] | undefined;
  isPending: boolean;
  isError: boolean;
  onEdit: (account: TreasuryAccount) => void;
}

function AccountList({ accounts, isPending, isError, onEdit }: AccountListProps) {
  if (isPending) {
    return <p className="text-ink-muted">Chargement des comptes…</p>;
  }
  if (isError || !accounts) {
    return <Alert>Impossible de charger les comptes, réessayez plus tard</Alert>;
  }
  if (accounts.length === 0) {
    return (
      <p className="text-ink-muted">
        Aucun compte. Déclare au moins une caisse pour pouvoir ouvrir une soirée.
      </p>
    );
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {accounts.map((account) => (
        <li key={account.id}>
          <AccountCard account={account} onEdit={() => onEdit(account)} />
        </li>
      ))}
    </ul>
  );
}

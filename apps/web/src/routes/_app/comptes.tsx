import { createFileRoute } from '@tanstack/react-router';
import { AccountsPage } from '../../accounts/accounts-page.tsx';

export const Route = createFileRoute('/_app/comptes')({
  component: AccountsPage,
});

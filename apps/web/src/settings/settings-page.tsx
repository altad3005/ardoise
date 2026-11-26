import { useQuery } from '@tanstack/react-query';
import { fetchAccounts } from '../api/accounts.ts';
import { fetchProjects } from '../api/projects.ts';
import { fetchSettings } from '../api/settings.ts';
import { accountsQueryKey } from '../accounts/accounts-query-key.ts';
import { projectsQueryKey } from '../projects/projects-query-keys.ts';
import { Alert } from '../ui/alert.tsx';
import { Card } from '../ui/card.tsx';
import { PageHeader } from '../ui/page-header.tsx';
import { SettingsForm } from './settings-form.tsx';
import { settingsQueryKey } from './settings-query-key.ts';

export function SettingsPage() {
  const settings = useQuery({ queryKey: settingsQueryKey, queryFn: fetchSettings });
  const projects = useQuery({ queryKey: projectsQueryKey, queryFn: fetchProjects });
  const accounts = useQuery({ queryKey: accountsQueryKey, queryFn: fetchAccounts });

  const header = (
    <PageHeader
      title="Paramétrage"
      subtitle="Les choix par défaut utilisés à l’ouverture des soirées et à l’achat de marchandise."
    />
  );

  if (settings.isPending || projects.isPending || accounts.isPending) {
    return (
      <section className="max-w-3xl">
        {header}
        <p className="text-ink-muted">Chargement du paramétrage…</p>
      </section>
    );
  }
  if (settings.isError || projects.isError || accounts.isError) {
    return (
      <section className="max-w-3xl">
        {header}
        <Alert>Impossible de charger le paramétrage, réessayez plus tard</Alert>
      </section>
    );
  }

  const cashAccounts = accounts.data.filter((account) => account.type === 'CASH');

  return (
    <section className="max-w-3xl">
      {header}
      {(projects.data.length === 0 || cashAccounts.length === 0) && (
        <p className="mb-4 text-ink-muted">
          Créez d’abord vos projets et votre compte caisse dans les pages Projets et Comptes.
        </p>
      )}
      <Card className="p-4">
        <SettingsForm
          settings={settings.data}
          projects={projects.data}
          cashAccounts={cashAccounts}
        />
      </Card>
    </section>
  );
}

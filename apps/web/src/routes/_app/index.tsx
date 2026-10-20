import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { fetchHealth, type ServiceName } from '../../api/health.ts';
import { Card } from '../../ui/card.tsx';
import { classNames } from '../../ui/class-names.ts';
import { PageHeader } from '../../ui/page-header.tsx';

export const Route = createFileRoute('/_app/')({
  component: HomePage,
});

function HomePage() {
  return (
    <section>
      <PageHeader title="Accueil" />
      <h2 className="mb-2 font-display text-xl font-bold">État des services</h2>
      <Card>
        <ul className="divide-y divide-line">
          <ServiceStatus service="identity" label="Identité" />
          <ServiceStatus service="management" label="Gestion" />
        </ul>
      </Card>
    </section>
  );
}

function ServiceStatus({ service, label }: { service: ServiceName; label: string }) {
  const { isPending, isError } = useQuery({
    queryKey: ['health', service],
    queryFn: () => fetchHealth(service),
    retry: false,
  });

  const status = isPending ? 'Vérification…' : isError ? 'Indisponible' : 'Opérationnel';
  const tone = isPending ? 'text-ink-muted' : isError ? 'text-danger' : 'text-success';
  const dot = isPending ? 'bg-ink-muted' : isError ? 'bg-danger' : 'bg-success';

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className={classNames('size-3 rounded-full', dot)} aria-hidden="true" />
      <span className="font-semibold">{label}</span>
      <span className={classNames('ml-auto text-sm font-semibold', tone)}>{status}</span>
    </li>
  );
}

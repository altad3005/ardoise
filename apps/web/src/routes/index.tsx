import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { fetchHealth, type ServiceName } from '../api/health.ts';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">État des services</h2>
      <ul className="space-y-2">
        <ServiceStatus service="identity" label="Identité" />
        <ServiceStatus service="management" label="Gestion" />
      </ul>
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
  const color = isPending ? 'bg-stone-400' : isError ? 'bg-red-600' : 'bg-green-600';

  return (
    <li className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3">
      <span className={`size-3 rounded-full ${color}`} aria-hidden="true" />
      <span className="font-medium">{label}</span>
      <span className="ml-auto text-sm text-stone-600">{status}</span>
    </li>
  );
}

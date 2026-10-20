import { Link, Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_public')({
  component: PublicLayout,
});

const highlights = [
  {
    title: 'Une caisse faite pour le comptoir',
    detail:
      'Les articles du soir, le total toujours visible, l’annulation de la dernière vente. Utilisable sur téléphone, tablette ou ordinateur.',
  },
  {
    title: 'Les ardoises, enfin tenues',
    detail:
      'Une consommation à crédit au nom d’une personne, répartissable entre plusieurs, réglée au bar ou plus tard. On sait qui doit quoi.',
  },
  {
    title: 'Plusieurs associations, chacune chez elle',
    detail:
      'Unité scoute, cercle étudiant, comité des fêtes : chacune ne voit que ses propres données, sur la même plateforme.',
  },
];

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-2">
      <section
        data-theme="service"
        className="flex flex-col gap-10 px-4 py-10 sm:px-8 lg:px-14 lg:py-14"
      >
        <Link to="/" className="font-display text-2xl font-bold">
          Ardoise
        </Link>
        <div>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Le bar, le stock et la trésorerie de votre association, au même endroit.
          </h2>
          <p className="mt-4 max-w-md text-lg text-ink-muted">
            Une opération réelle se saisit une seule fois. Ses conséquences sur le stock et sur
            l'argent se calculent toutes seules.
          </p>
        </div>
        <ul className="flex flex-col gap-6">
          {highlights.map((highlight) => (
            <li key={highlight.title} className="border-l-2 border-accent pl-4">
              <p className="font-semibold">{highlight.title}</p>
              <p className="mt-1 text-ink-muted">{highlight.detail}</p>
            </li>
          ))}
        </ul>
        <p className="mt-auto text-sm text-ink-muted">
          Logiciel libre, licence MIT ·{' '}
          <a href="https://github.com/altad3005/ardoise" className="text-accent underline">
            Le code sur GitHub
          </a>
        </p>
      </section>
      <main className="flex items-center justify-center px-4 py-10 lg:px-8">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

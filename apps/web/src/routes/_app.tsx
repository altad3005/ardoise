import { Link, Outlet, createFileRoute } from '@tanstack/react-router';
import { Logo } from '../ui/logo.tsx';

export const Route = createFileRoute('/_app')({
  component: AppLayout,
});

const navigationLinks = [
  { to: '/', label: 'Accueil', exact: true },
  { to: '/catalogue', label: 'Catalogue', exact: false },
  { to: '/menu', label: 'Carte', exact: false },
] as const;

function AppLayout() {
  return (
    <div className="min-h-screen lg:flex">
      <header className="flex items-center gap-4 border-b border-line bg-surface px-4 py-3 lg:hidden">
        <Brand />
        <RegisterLink />
      </header>
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface lg:static lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:border-t-0 lg:border-r lg:px-4 lg:py-6"
      >
        <div className="mb-8 hidden px-3 lg:block">
          <Brand />
        </div>
        <ul className="grid grid-cols-3 lg:flex lg:flex-col lg:gap-1">
          {navigationLinks.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                activeOptions={{ exact: link.exact }}
                className="flex min-h-14 items-center justify-center font-semibold focus-visible:-outline-offset-4 text-ink-muted hover:text-ink aria-[current=page]:text-accent lg:min-h-11 lg:justify-start lg:rounded-md lg:px-3 lg:aria-[current=page]:bg-accent-soft"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto hidden lg:block">
          <RegisterLink />
        </div>
      </nav>
      <main className="mx-auto w-full max-w-5xl min-w-0 px-4 py-6 pb-24 lg:px-8 lg:pb-6">
        <Outlet />
      </main>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/">
      <Logo className="h-7" />
    </Link>
  );
}

function RegisterLink() {
  return (
    <Link
      to="/register"
      className="ml-auto inline-flex min-h-11 items-center rounded-md px-3 font-semibold text-ink-muted hover:bg-surface-raised hover:text-ink"
    >
      Créer un compte
    </Link>
  );
}

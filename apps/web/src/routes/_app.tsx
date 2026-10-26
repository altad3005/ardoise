import { Link, Outlet, createFileRoute } from '@tanstack/react-router';
import {
  ClipboardList,
  FolderKanban,
  House,
  Landmark,
  Package,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { Logo } from '../ui/logo.tsx';

export const Route = createFileRoute('/_app')({
  component: AppLayout,
});

interface NavigationLink {
  to: '/' | '/catalogue' | '/menu' | '/comptes' | '/projets';
  label: string;
  icon: LucideIcon;
  exact: boolean;
}

interface NavigationGroup {
  title?: string;
  links: NavigationLink[];
}

const navigationGroups: NavigationGroup[] = [
  { links: [{ to: '/', label: 'Accueil', icon: House, exact: true }] },
  {
    title: 'Bar',
    links: [
      { to: '/catalogue', label: 'Catalogue', icon: Package, exact: false },
      { to: '/menu', label: 'Carte', icon: ClipboardList, exact: false },
    ],
  },
  {
    title: 'Trésorerie',
    links: [
      { to: '/comptes', label: 'Comptes', icon: Landmark, exact: false },
      { to: '/projets', label: 'Projets', icon: FolderKanban, exact: false },
    ],
  },
];

function AppLayout() {
  return (
    <div className="min-h-screen lg:flex">
      <header className="flex items-center gap-4 border-b border-line bg-surface px-4 py-3 lg:hidden">
        <Brand />
        <RegisterLink />
      </header>
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:overflow-y-auto lg:shrink-0 lg:flex-col lg:border-t-0 lg:border-r lg:px-3 lg:py-5"
      >
        <div className="mb-6 hidden px-3 lg:block">
          <Brand />
        </div>
        <ul className="grid grid-cols-5 lg:flex lg:flex-col lg:gap-4">
          {navigationGroups.map((group) => (
            <li key={group.title ?? 'main'} className="contents lg:block">
              {group.title && (
                <p className="hidden px-3 pb-1.5 text-xs font-bold tracking-wider text-ink-muted uppercase lg:block">
                  {group.title}
                </p>
              )}
              <ul className="contents lg:flex lg:flex-col lg:gap-0.5">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <NavigationItem link={link} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <div className="mt-auto hidden border-t border-line pt-3 lg:block">
          <RegisterLink />
        </div>
      </nav>
      <main className="mx-auto w-full max-w-5xl min-w-0 px-4 py-6 pb-24 lg:px-8 lg:pb-6">
        <Outlet />
      </main>
    </div>
  );
}

function NavigationItem({ link }: { link: NavigationLink }) {
  const Icon = link.icon;
  return (
    <Link
      to={link.to}
      activeOptions={{ exact: link.exact }}
      className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink focus-visible:-outline-offset-4 aria-[current=page]:text-accent lg:min-h-10 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-md lg:px-3 lg:text-base lg:aria-[current=page]:bg-accent-soft"
    >
      <Icon aria-hidden="true" className="size-5 shrink-0" />
      {link.label}
    </Link>
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
      className="ml-auto inline-flex min-h-11 items-center gap-3 rounded-md px-3 font-semibold text-ink-muted hover:bg-surface-raised hover:text-ink"
    >
      <UserPlus aria-hidden="true" className="hidden size-5 lg:block" />
      Créer un compte
    </Link>
  );
}

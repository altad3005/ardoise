import { Link, Outlet, createRootRoute } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="flex items-center border-b border-stone-200 bg-white px-4 py-3">
        <Link to="/" className="text-lg font-semibold">
          Ardoise
        </Link>
        <Link to="/register" className="ml-auto text-sm font-medium text-stone-700 hover:underline">
          Créer un compte
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

import { createFileRoute } from '@tanstack/react-router';
import { MenuPage } from '../../menu/menu-page.tsx';

export const Route = createFileRoute('/_app/menu')({
  component: MenuPage,
});

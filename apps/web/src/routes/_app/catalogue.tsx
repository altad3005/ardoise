import { createFileRoute } from '@tanstack/react-router';
import { CataloguePage } from '../../catalogue/catalogue-page.tsx';

export const Route = createFileRoute('/_app/catalogue')({
  component: CataloguePage,
});

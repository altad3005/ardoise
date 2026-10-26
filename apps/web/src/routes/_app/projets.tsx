import { createFileRoute } from '@tanstack/react-router';
import { ProjectsPage } from '../../projects/projects-page.tsx';

export const Route = createFileRoute('/_app/projets')({
  component: ProjectsPage,
});

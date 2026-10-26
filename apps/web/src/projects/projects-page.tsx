import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { fetchProjectCategories, fetchProjects } from '../api/projects.ts';
import { Alert } from '../ui/alert.tsx';
import { Button } from '../ui/button.tsx';
import { Card } from '../ui/card.tsx';
import { PageHeader } from '../ui/page-header.tsx';
import { CategoryFolder } from './category-folder.tsx';
import { CategoryForm } from './category-form.tsx';
import { ProjectForm } from './project-form.tsx';
import { projectCategoriesQueryKey, projectsQueryKey } from './projects-query-keys.ts';

export function ProjectsPage() {
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const categories = useQuery({
    queryKey: projectCategoriesQueryKey,
    queryFn: fetchProjectCategories,
  });
  const projects = useQuery({ queryKey: projectsQueryKey, queryFn: fetchProjects });

  const isEmpty = categories.data?.length === 0;
  const header = (
    <PageHeader
      title="Projets"
      subtitle="Chaque recette et chaque dépense est imputée à un projet : une soirée, un camp, une action de financement…"
      actions={
        <>
          <Button
            variant="secondary"
            disabled={isCreatingCategory || isEmpty}
            onClick={() => setIsCreatingCategory(true)}
          >
            Nouvelle catégorie
          </Button>
          <Button
            disabled={isCreatingProject || !categories.data?.length}
            onClick={() => setIsCreatingProject(true)}
          >
            Nouveau projet
          </Button>
        </>
      }
    />
  );

  if (categories.isPending || projects.isPending) {
    return (
      <section className="max-w-3xl">
        {header}
        <p className="text-ink-muted">Chargement des projets…</p>
      </section>
    );
  }
  if (categories.isError || projects.isError) {
    return (
      <section className="max-w-3xl">
        {header}
        <Alert>Impossible de charger les projets, réessayez plus tard</Alert>
      </section>
    );
  }

  return (
    <section className="max-w-3xl">
      {header}
      {isEmpty && (
        <p className="mb-4 text-ink-muted">
          Commencez par créer une catégorie, par exemple Bar, Camp ou Financement. Chaque projet
          appartient à une catégorie.
        </p>
      )}
      {(isCreatingCategory || isEmpty) && (
        <Card className="mb-6 p-4">
          <h2 className="mb-4 font-display text-xl font-bold">Nouvelle catégorie</h2>
          <CategoryForm
            onDone={() => setIsCreatingCategory(false)}
            onCancel={isEmpty ? undefined : () => setIsCreatingCategory(false)}
          />
        </Card>
      )}
      {isCreatingProject && (
        <Card className="mb-6 p-4">
          <h2 className="mb-4 font-display text-xl font-bold">Nouveau projet</h2>
          <ProjectForm
            categories={categories.data}
            onDone={() => setIsCreatingProject(false)}
            onCancel={() => setIsCreatingProject(false)}
          />
        </Card>
      )}
      <div className="flex flex-col gap-4">
        {categories.data.map((category) => (
          <CategoryFolder
            key={category.id}
            category={category}
            projects={projects.data.filter((project) => project.categoryId === category.id)}
            categories={categories.data}
          />
        ))}
      </div>
    </section>
  );
}

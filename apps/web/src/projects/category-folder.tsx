import type { ProjectCategory, TreasuryProject } from '@ardoise/types';
import { Folder, Pencil } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button.tsx';
import { Card } from '../ui/card.tsx';
import { CategoryForm } from './category-form.tsx';
import { ProjectRow } from './project-row.tsx';

interface CategoryFolderProps {
  category: ProjectCategory;
  projects: TreasuryProject[];
  categories: ProjectCategory[];
}

export function CategoryFolder({ category, projects, categories }: CategoryFolderProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const headingId = `category-${category.id}`;
  const stopRenaming = () => setIsRenaming(false);

  return (
    <section aria-labelledby={headingId}>
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line bg-surface-raised py-2 pr-2 pl-4">
          <Folder aria-hidden="true" className="size-5 shrink-0 text-ink-muted" />
          <div className="min-w-0 grow">
            <p className="text-xs font-bold tracking-wider text-ink-muted uppercase">Catégorie</p>
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <h2 id={headingId} className="text-lg font-bold break-words">
                {category.name}
              </h2>
              <p className="text-sm text-ink-muted">· {projectCount(projects.length)}</p>
            </div>
          </div>
          {!isRenaming && (
            <Button
              variant="ghost"
              aria-label={`Renommer la catégorie ${category.name}`}
              onClick={() => setIsRenaming(true)}
            >
              <Pencil aria-hidden="true" className="size-4" />
              Renommer
            </Button>
          )}
        </div>
        {isRenaming && (
          <div className="border-b border-line bg-accent-soft p-4">
            <CategoryForm category={category} onDone={stopRenaming} onCancel={stopRenaming} />
          </div>
        )}
        {projects.length === 0 ? (
          <p className="py-3 pr-4 pl-12 text-sm text-ink-muted">
            Aucun projet dans cette catégorie
          </p>
        ) : (
          <ul
            aria-label={`Projets de la catégorie ${category.name}`}
            className="divide-y divide-line"
          >
            {projects.map((project) => (
              <ProjectRow key={project.id} project={project} categories={categories} />
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}

function projectCount(count: number): string {
  return count > 1 ? `${count} projets` : `${count} projet`;
}

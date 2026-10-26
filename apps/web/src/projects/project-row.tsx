import type { ProjectCategory, TreasuryProject } from '@ardoise/types';
import { useState } from 'react';
import { EditButton } from '../ui/edit-button.tsx';
import { ProjectForm } from './project-form.tsx';

interface ProjectRowProps {
  project: TreasuryProject;
  categories: ProjectCategory[];
}

export function ProjectRow({ project, categories }: ProjectRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const stopEditing = () => setIsEditing(false);

  if (isEditing) {
    return (
      <li className="bg-accent-soft p-4 sm:pl-12">
        <ProjectForm
          project={project}
          categories={categories}
          onDone={stopEditing}
          onCancel={stopEditing}
        />
      </li>
    );
  }
  return (
    <li className="flex items-center gap-3 py-2 pr-3 pl-12">
      <span className="min-w-0 grow font-semibold break-words">{project.name}</span>
      <EditButton itemName={project.name} onClick={() => setIsEditing(true)} />
    </li>
  );
}

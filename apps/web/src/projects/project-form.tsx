import {
  newProjectSchema,
  type NewProject,
  type ProjectCategory,
  type ProjectChanges,
  type TreasuryProject,
} from '@ardoise/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type SubmitEvent } from 'react';
import { ApiError } from '../api/api-error.ts';
import { createProject, updateProject } from '../api/projects.ts';
import { Alert } from '../ui/alert.tsx';
import { Button } from '../ui/button.tsx';
import { SelectField } from '../ui/select-field.tsx';
import { TextField } from '../ui/text-field.tsx';
import { projectsQueryKey } from './projects-query-keys.ts';

const invalidNameMessage = 'Le nom doit faire entre 1 et 60 caractères';
const nameTakenMessage = 'Ce nom est déjà utilisé';

interface ProjectFormProps {
  project?: TreasuryProject;
  categories: ProjectCategory[];
  onDone: () => void;
  onCancel?: () => void;
}

export function ProjectForm({ project, categories, onDone, onCancel }: ProjectFormProps) {
  const [name, setName] = useState(project?.name ?? '');
  const [categoryId, setCategoryId] = useState(project?.categoryId ?? categories[0]?.id ?? '');
  const [isNameInvalid, setIsNameInvalid] = useState(false);
  const queryClient = useQueryClient();
  const saving = useMutation({
    mutationFn: (values: NewProject) =>
      project ? updateProject(project.id, changesOf(project, values)) : createProject(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectsQueryKey });
      onDone();
    },
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = newProjectSchema.safeParse({ name, categoryId });
    setIsNameInvalid(!result.success);
    if (!result.success) {
      return;
    }
    if (project && Object.keys(changesOf(project, result.data)).length === 0) {
      onDone();
      return;
    }
    saving.mutate(result.data);
  };

  const idPrefix = project ? `project-${project.id}` : 'new-project';
  const status = saving.error instanceof ApiError ? saving.error.status : null;
  const nameError = isNameInvalid ? invalidNameMessage : status === 409 ? nameTakenMessage : null;

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-3">
      <TextField
        id={`${idPrefix}-name`}
        label="Nom"
        placeholder="Brunch de Noël"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={nameError}
      />
      <SelectField
        id={`${idPrefix}-category`}
        label="Catégorie"
        value={categoryId}
        onChange={(event) => setCategoryId(event.target.value)}
      >
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </SelectField>
      {saving.isError && status !== 409 && (
        <Alert>Une erreur est survenue, réessayez plus tard</Alert>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" isPending={saving.isPending}>
          {project ? 'Enregistrer' : 'Créer le projet'}
        </Button>
      </div>
    </form>
  );
}

function changesOf(project: TreasuryProject, values: NewProject): ProjectChanges {
  return {
    ...(values.name !== project.name && { name: values.name }),
    ...(values.categoryId !== project.categoryId && { categoryId: values.categoryId }),
  };
}

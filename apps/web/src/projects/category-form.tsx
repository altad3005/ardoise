import { newProjectCategorySchema, type ProjectCategory } from '@ardoise/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type SubmitEvent } from 'react';
import { ApiError } from '../api/api-error.ts';
import { createProjectCategory, renameProjectCategory } from '../api/projects.ts';
import { Alert } from '../ui/alert.tsx';
import { Button } from '../ui/button.tsx';
import { TextField } from '../ui/text-field.tsx';
import { projectCategoriesQueryKey } from './projects-query-keys.ts';

const invalidNameMessage = 'Le nom doit faire entre 1 et 60 caractères';
const nameTakenMessage = 'Ce nom est déjà utilisé';

interface CategoryFormProps {
  category?: ProjectCategory;
  onDone: () => void;
  onCancel?: () => void;
}

export function CategoryForm({ category, onDone, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [isNameInvalid, setIsNameInvalid] = useState(false);
  const queryClient = useQueryClient();
  const saving = useMutation({
    mutationFn: (newName: string) =>
      category
        ? renameProjectCategory(category.id, { name: newName })
        : createProjectCategory({ name: newName }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectCategoriesQueryKey });
      onDone();
    },
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = newProjectCategorySchema.safeParse({ name });
    setIsNameInvalid(!result.success);
    if (result.success) {
      saving.mutate(result.data.name);
    }
  };

  const status = saving.error instanceof ApiError ? saving.error.status : null;
  const nameError = isNameInvalid ? invalidNameMessage : status === 409 ? nameTakenMessage : null;

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-3">
      <TextField
        id={category ? `category-name-${category.id}` : 'new-category-name'}
        label="Nom"
        placeholder="Bar"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={nameError}
      />
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
          {category ? 'Enregistrer' : 'Créer la catégorie'}
        </Button>
      </div>
    </form>
  );
}

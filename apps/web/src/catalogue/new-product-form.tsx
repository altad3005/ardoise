import { newProductSchema, productCategorySchema, type NewProduct } from '@ardoise/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type ChangeEvent, type ReactNode, type SubmitEvent } from 'react';
import { ApiError } from '../api/api-error.ts';
import { createProduct } from '../api/products.ts';
import { categoryLabels } from './category-labels.ts';

type Field = keyof NewProduct;
type FieldErrors = Partial<Record<Field, string>>;

const fieldErrorMessages: Record<Field, string> = {
  name: 'Le nom doit faire entre 1 et 80 caractères',
  category: 'Choisissez une catégorie',
  stockUnit: "L'unité de stock doit faire entre 1 et 30 caractères",
};

const emptyProduct: NewProduct = { name: '', category: 'PILSNER', stockUnit: '' };

interface NewProductFormProps {
  onClose: () => void;
}

export function NewProductForm({ onClose }: NewProductFormProps) {
  const [newProduct, setNewProduct] = useState(emptyProduct);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const queryClient = useQueryClient();
  const creation = useMutation({
    mutationFn: createProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
    },
  });

  const update = (field: Field) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewProduct({ ...newProduct, [field]: event.target.value });
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = newProductSchema.safeParse(newProduct);
    if (!result.success) {
      setFieldErrors(toFieldErrors(result.error.issues));
      return;
    }
    setFieldErrors({});
    creation.mutate(result.data);
  };

  const isNameTaken = creation.error instanceof ApiError && creation.error.status === 409;
  const nameError = fieldErrors.name ?? (isNameTaken ? 'Un produit porte déjà ce nom' : null);

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="mb-6 grid gap-4 rounded-lg border border-stone-200 bg-white px-4 py-5 sm:grid-cols-3"
    >
      <FormField id="name" label="Nom" error={nameError}>
        <input
          id="name"
          value={newProduct.name}
          onChange={update('name')}
          aria-invalid={Boolean(nameError)}
          aria-describedby="name-error"
          className={inputClassName}
        />
      </FormField>
      <FormField id="category" label="Catégorie">
        <select
          id="category"
          value={newProduct.category}
          onChange={update('category')}
          className={inputClassName}
        >
          {productCategorySchema.options.map((category) => (
            <option key={category} value={category}>
              {categoryLabels[category]}
            </option>
          ))}
        </select>
      </FormField>
      <FormField id="stockUnit" label="Unité de stock" error={fieldErrors.stockUnit}>
        <input
          id="stockUnit"
          placeholder="bouteille, canette…"
          value={newProduct.stockUnit}
          onChange={update('stockUnit')}
          aria-invalid={Boolean(fieldErrors.stockUnit)}
          aria-describedby="stockUnit-error"
          className={inputClassName}
        />
      </FormField>
      {creation.isError && !isNameTaken && (
        <p role="alert" className="text-sm text-red-700 sm:col-span-3">
          Une erreur est survenue, réessayez plus tard
        </p>
      )}
      <div className="flex justify-end gap-2 sm:col-span-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-stone-300 px-3 py-1 text-sm text-stone-700 hover:bg-stone-100"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={creation.isPending}
          className="rounded-md bg-stone-900 px-3 py-1 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-60"
        >
          {creation.isPending ? 'Création…' : 'Créer'}
        </button>
      </div>
    </form>
  );
}

const inputClassName =
  'w-full rounded-md border border-stone-300 px-3 py-2 aria-invalid:border-red-600';

interface FormFieldProps {
  id: Field;
  label: string;
  error?: string | null;
  children: ReactNode;
}

function FormField({ id, label, error, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function toFieldErrors(issues: readonly { path: readonly PropertyKey[] }[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (field === 'name' || field === 'category' || field === 'stockUnit') {
      errors[field] = fieldErrorMessages[field];
    }
  }
  return errors;
}

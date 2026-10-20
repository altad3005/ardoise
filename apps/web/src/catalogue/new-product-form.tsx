import { newProductSchema, productCategorySchema, type NewProduct } from '@ardoise/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type ChangeEvent, type SubmitEvent } from 'react';
import { ApiError } from '../api/api-error.ts';
import { createProduct } from '../api/products.ts';
import { toFieldErrors } from '../forms/field-errors.ts';
import { Alert } from '../ui/alert.tsx';
import { Button } from '../ui/button.tsx';
import { Card } from '../ui/card.tsx';
import { SelectField } from '../ui/select-field.tsx';
import { TextField } from '../ui/text-field.tsx';
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
      setFieldErrors(toFieldErrors(result.error.issues, fieldErrorMessages));
      return;
    }
    setFieldErrors({});
    creation.mutate(result.data);
  };

  const isNameTaken = creation.error instanceof ApiError && creation.error.status === 409;
  const nameError = fieldErrors.name ?? (isNameTaken ? 'Un produit porte déjà ce nom' : null);

  return (
    <Card className="mb-6 p-4">
      <form noValidate onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
        <TextField
          id="name"
          label="Nom"
          value={newProduct.name}
          onChange={update('name')}
          error={nameError}
        />
        <SelectField
          id="category"
          label="Catégorie"
          value={newProduct.category}
          onChange={update('category')}
        >
          {productCategorySchema.options.map((category) => (
            <option key={category} value={category}>
              {categoryLabels[category]}
            </option>
          ))}
        </SelectField>
        <TextField
          id="stockUnit"
          label="Unité de stock"
          placeholder="bouteille, canette…"
          value={newProduct.stockUnit}
          onChange={update('stockUnit')}
          error={fieldErrors.stockUnit}
        />
        {creation.isError && !isNameTaken && (
          <div className="sm:col-span-3">
            <Alert>Une erreur est survenue, réessayez plus tard</Alert>
          </div>
        )}
        <div className="flex justify-end gap-2 sm:col-span-3">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" isPending={creation.isPending}>
            {creation.isPending ? 'Création…' : 'Créer'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

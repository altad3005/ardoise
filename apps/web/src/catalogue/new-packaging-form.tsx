import { newPackagingSchema, type NewPackaging } from '@ardoise/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type SubmitEvent } from 'react';
import { ApiError } from '../api/api-error.ts';
import { createPackaging } from '../api/packagings.ts';
import { toFieldErrors } from '../forms/field-errors.ts';
import { Alert } from '../ui/alert.tsx';
import { Button } from '../ui/button.tsx';
import { TextField } from '../ui/text-field.tsx';
import { packagingsQueryKey } from './packaging-query-key.ts';

type Field = keyof NewPackaging;
type FieldErrors = Partial<Record<Field, string>>;

const fieldErrorMessages: Record<Field, string> = {
  label: 'Le libellé doit faire entre 1 et 40 caractères',
  unitCount: "Le nombre d'unités doit être un nombre positif",
};

interface NewPackagingFormProps {
  productId: string;
  onClose: () => void;
}

export function NewPackagingForm({ productId, onClose }: NewPackagingFormProps) {
  const [label, setLabel] = useState('');
  const [unitCount, setUnitCount] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const queryClient = useQueryClient();
  const creation = useMutation({
    mutationFn: (newPackaging: NewPackaging) => createPackaging(productId, newPackaging),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: packagingsQueryKey(productId) });
      onClose();
    },
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = newPackagingSchema.safeParse({ label, unitCount: parseDecimal(unitCount) });
    if (!result.success) {
      setFieldErrors(toFieldErrors(result.error.issues, fieldErrorMessages));
      return;
    }
    setFieldErrors({});
    creation.mutate(result.data);
  };

  const isLabelTaken = creation.error instanceof ApiError && creation.error.status === 409;
  const labelError =
    fieldErrors.label ?? (isLabelTaken ? 'Un conditionnement porte déjà ce libellé' : null);

  return (
    <form noValidate onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      <TextField
        id="packagingLabel"
        label="Libellé"
        placeholder="bac de 24"
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        error={labelError}
      />
      <TextField
        id="packagingUnitCount"
        label="Nombre d'unités"
        inputMode="decimal"
        placeholder="24"
        value={unitCount}
        onChange={(event) => setUnitCount(event.target.value)}
        error={fieldErrors.unitCount}
      />
      {creation.isError && !isLabelTaken && (
        <div className="sm:col-span-2">
          <Alert>Une erreur est survenue, réessayez plus tard</Alert>
        </div>
      )}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" isPending={creation.isPending}>
          {creation.isPending ? 'Ajout…' : 'Ajouter'}
        </Button>
      </div>
    </form>
  );
}

function parseDecimal(value: string): number {
  return value.trim() === '' ? Number.NaN : Number(value.replace(',', '.'));
}

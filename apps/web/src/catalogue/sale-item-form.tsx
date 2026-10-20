import {
  newSaleItemSchema,
  newStocklessSaleItemSchema,
  type CatalogueSaleItem,
  type SaleItemChanges,
} from '@ardoise/types';
import { useMutation } from '@tanstack/react-query';
import { useId, useState, type SubmitEvent } from 'react';
import { ApiError } from '../api/api-error.ts';
import { toFieldErrors } from '../forms/field-errors.ts';
import { formatQuantity } from '../forms/number-format.ts';
import { parsePriceInCents, parseQuantity } from '../forms/number-input.ts';
import { Alert } from '../ui/alert.tsx';
import { Button } from '../ui/button.tsx';
import { TextField } from '../ui/text-field.tsx';

type Field = keyof SaleItemChanges;
type FieldErrors = Partial<Record<Field, string>>;

const fieldErrorMessages: Record<Field, string> = {
  name: 'Le nom doit faire entre 1 et 60 caractères',
  consumedQuantity: 'Indiquez une quantité positive, par exemple 1 ou 1/20',
  basePriceCents: 'Indiquez un prix en euros, par exemple 2,50',
};

interface SaleItemFormProps {
  hasStock: boolean;
  stockUnit?: string;
  initialItem?: CatalogueSaleItem;
  save: (changes: SaleItemChanges) => Promise<unknown>;
  onDone: () => void;
}

export function SaleItemForm({
  hasStock,
  stockUnit,
  initialItem,
  save,
  onDone,
}: SaleItemFormProps) {
  const idPrefix = useId();
  const [name, setName] = useState(initialItem?.name ?? '');
  const [consumedQuantity, setConsumedQuantity] = useState(
    initialItem?.consumedQuantity == null ? '' : formatQuantity(initialItem.consumedQuantity),
  );
  const [basePrice, setBasePrice] = useState(
    initialItem?.basePriceCents == null ? '' : toEuroInput(initialItem.basePriceCents),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const saving = useMutation({
    mutationFn: (changes: SaleItemChanges) => save(changes),
    onSuccess: onDone,
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const basePriceCents = parsePriceInCents(basePrice);
    const result = hasStock
      ? newSaleItemSchema.safeParse({
          name,
          consumedQuantity: parseQuantity(consumedQuantity),
          basePriceCents,
        })
      : newStocklessSaleItemSchema.safeParse({ name, basePriceCents });
    if (!result.success) {
      setFieldErrors(toFieldErrors(result.error.issues, fieldErrorMessages));
      return;
    }
    setFieldErrors({});
    saving.mutate(result.data);
  };

  const isNameTaken = saving.error instanceof ApiError && saving.error.status === 409;
  const nameError = fieldErrors.name ?? (isNameTaken ? 'Un article porte déjà ce nom' : null);

  return (
    <form noValidate onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <TextField
          id={`${idPrefix}-name`}
          label="Nom"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={nameError}
        />
      </div>
      {hasStock && (
        <TextField
          id={`${idPrefix}-consumedQuantity`}
          label="Quantité consommée"
          hint={`En ${stockUnit}, par exemple 1 ou 1/20`}
          inputMode="decimal"
          value={consumedQuantity}
          onChange={(event) => setConsumedQuantity(event.target.value)}
          error={fieldErrors.consumedQuantity}
        />
      )}
      <TextField
        id={`${idPrefix}-basePrice`}
        label="Prix de base"
        inputMode="decimal"
        placeholder="2,50"
        value={basePrice}
        onChange={(event) => setBasePrice(event.target.value)}
        error={fieldErrors.basePriceCents}
      />
      {saving.isError && !isNameTaken && (
        <div className="sm:col-span-2">
          <Alert>Une erreur est survenue, réessayez plus tard</Alert>
        </div>
      )}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button variant="secondary" onClick={onDone}>
          Annuler
        </Button>
        <Button type="submit" isPending={saving.isPending}>
          {saving.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}

function toEuroInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

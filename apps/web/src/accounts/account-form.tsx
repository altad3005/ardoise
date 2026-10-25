import {
  accountTypeSchema,
  newAccountSchema,
  type AccountChanges,
  type AccountType,
  type NewAccount,
  type TreasuryAccount,
} from '@ardoise/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type SubmitEvent } from 'react';
import { createAccount, updateAccount } from '../api/accounts.ts';
import { ApiError } from '../api/api-error.ts';
import { toFieldErrors } from '../forms/field-errors.ts';
import { parseSignedPriceInCents } from '../forms/number-input.ts';
import { Alert } from '../ui/alert.tsx';
import { Button } from '../ui/button.tsx';
import { classNames } from '../ui/class-names.ts';
import { TextField } from '../ui/text-field.tsx';
import { accountTypeLabels } from './account-type-labels.ts';
import { accountsQueryKey } from './accounts-query-key.ts';

type Field = 'name' | 'openingBalanceCents';
type FieldErrors = Partial<Record<Field, string>>;

const fieldErrorMessages: Record<Field, string> = {
  name: 'Le nom doit faire entre 1 et 60 caractères',
  openingBalanceCents: 'Saisis un montant, par exemple 150,00',
};
const negativeCashMessage = 'Une caisse ne peut pas démarrer avec un solde négatif';
const nameTakenMessage = 'Ce nom est déjà utilisé';
const hasMovementsMessage =
  "Ce compte a déjà des mouvements : son solde d'ouverture ne peut plus changer";

interface AccountFormProps {
  account?: TreasuryAccount;
  onDone: () => void;
  onCancel?: () => void;
}

export function AccountForm({ account, onDone, onCancel }: AccountFormProps) {
  const [type, setType] = useState<AccountType>(account?.type ?? 'CASH');
  const [name, setName] = useState(account?.name ?? '');
  const [openingBalance, setOpeningBalance] = useState(
    account ? toAmountInput(account.openingBalanceCents) : '',
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const queryClient = useQueryClient();
  const saving = useMutation({
    mutationFn: (newAccount: NewAccount) =>
      account
        ? updateAccount(account.id, changesOf(account, newAccount))
        : createAccount(newAccount),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: accountsQueryKey });
      onDone();
    },
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = newAccountSchema.safeParse({
      name,
      type,
      openingBalanceCents: parseSignedPriceInCents(openingBalance),
    });
    if (!result.success) {
      const errors = toFieldErrors(result.error.issues, fieldErrorMessages);
      if (result.error.issues.some((issue) => issue.code === 'custom')) {
        errors.openingBalanceCents = negativeCashMessage;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    saving.mutate(result.data);
  };

  const status = saving.error instanceof ApiError ? saving.error.status : null;
  const nameError = fieldErrors.name ?? (status === 409 ? nameTakenMessage : null);
  const openingBalanceError =
    fieldErrors.openingBalanceCents ?? (status === 422 ? hasMovementsMessage : null);
  const isUnexpectedError = saving.isError && status !== 409 && status !== 422;

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Type</legend>
        <div className="flex gap-2">
          {accountTypeSchema.options.toReversed().map((option) => (
            <label
              key={option}
              className={classNames(
                'flex min-h-11 grow items-center justify-center gap-2 rounded-md border px-3 font-semibold',
                type === option ? 'border-accent bg-accent-soft' : 'border-field',
                account && 'opacity-60',
              )}
            >
              <input
                type="radio"
                name="accountType"
                value={option}
                checked={type === option}
                disabled={Boolean(account)}
                onChange={() => setType(option)}
                className="accent-accent"
              />
              {accountTypeLabels[option]}
            </label>
          ))}
        </div>
      </fieldset>
      <TextField
        id="accountName"
        label="Nom"
        placeholder="Caisse du bar"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={nameError}
      />
      <TextField
        id="accountOpeningBalance"
        label="Solde d'ouverture (€)"
        inputMode="decimal"
        placeholder="150,00"
        hint="L'argent présent le jour de la mise en service. Un compte bancaire peut être à découvert."
        value={openingBalance}
        onChange={(event) => setOpeningBalance(event.target.value)}
        error={openingBalanceError}
      />
      {isUnexpectedError && <Alert>Une erreur est survenue, réessayez plus tard</Alert>}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" isPending={saving.isPending}>
          {account ? 'Enregistrer' : 'Créer le compte'}
        </Button>
      </div>
    </form>
  );
}

function toAmountInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

function changesOf(account: TreasuryAccount, edited: NewAccount): AccountChanges {
  return {
    ...(edited.name !== account.name && { name: edited.name }),
    ...(edited.openingBalanceCents !== account.openingBalanceCents && {
      openingBalanceCents: edited.openingBalanceCents,
    }),
  };
}

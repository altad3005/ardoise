import type { TreasuryAccount, TreasuryProject, TreasurySettings } from '@ardoise/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type SubmitEvent } from 'react';
import { saveSettings } from '../api/settings.ts';
import { Alert } from '../ui/alert.tsx';
import { Button } from '../ui/button.tsx';
import { SelectField } from '../ui/select-field.tsx';
import { settingsQueryKey } from './settings-query-key.ts';

interface SettingsFormProps {
  settings: TreasurySettings;
  projects: TreasuryProject[];
  cashAccounts: TreasuryAccount[];
}

interface Choice {
  id: string;
  name: string;
}

export function SettingsForm({ settings, projects, cashAccounts }: SettingsFormProps) {
  const [values, setValues] = useState(settings);
  const queryClient = useQueryClient();
  const saving = useMutation({
    mutationFn: saveSettings,
    onSuccess: (saved) => queryClient.setQueryData(settingsQueryKey, saved),
  });

  const choose = (field: keyof TreasurySettings) => (id: string | null) => {
    saving.reset();
    setValues((current) => ({ ...current, [field]: id }));
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    saving.mutate(values);
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-3">
      <ChoiceField
        id="default-project"
        label="Projet par défaut des soirées"
        hint="Proposé à l’ouverture d’une soirée."
        value={values.defaultProjectId}
        choices={projects}
        onChange={choose('defaultProjectId')}
      />
      <ChoiceField
        id="stock-project"
        label="Projet stock"
        hint="Porte les achats de marchandise destinée à la vente."
        value={values.stockProjectId}
        choices={projects}
        onChange={choose('stockProjectId')}
      />
      <ChoiceField
        id="default-cash-account"
        label="Compte caisse par défaut"
        hint="Reçoit les espèces des soirées."
        value={values.defaultCashAccountId}
        choices={cashAccounts}
        onChange={choose('defaultCashAccountId')}
      />
      {saving.isError && <Alert>Une erreur est survenue, réessayez plus tard</Alert>}
      {saving.isSuccess && <Alert tone="success">Paramétrage enregistré</Alert>}
      <div className="flex justify-end">
        <Button type="submit" isPending={saving.isPending}>
          Enregistrer
        </Button>
      </div>
    </form>
  );
}

interface ChoiceFieldProps {
  id: string;
  label: string;
  hint: string;
  value: string | null;
  choices: Choice[];
  onChange: (id: string | null) => void;
}

function ChoiceField({ id, label, hint, value, choices, onChange }: ChoiceFieldProps) {
  return (
    <SelectField
      id={id}
      label={label}
      hint={hint}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value || null)}
    >
      <option value="">Aucun</option>
      {choices.map((choice) => (
        <option key={choice.id} value={choice.id}>
          {choice.name}
        </option>
      ))}
    </SelectField>
  );
}

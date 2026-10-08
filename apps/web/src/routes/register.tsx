import { registrationSchema, type Registration } from '@ardoise/types';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState, type ChangeEvent, type ReactNode, type SubmitEvent } from 'react';
import { ApiError } from '../api/api-error.ts';
import { registerUser } from '../api/users.ts';

export const Route = createFileRoute('/register')({
  component: RegisterPage,
});

type Field = keyof Registration;
type FieldErrors = Partial<Record<Field, string>>;

const fieldErrorMessages: Record<Field, string> = {
  email: 'Adresse e-mail invalide',
  displayName: 'Le nom affiché doit faire entre 1 et 50 caractères',
  password: 'Le mot de passe doit faire entre 12 et 128 caractères',
};

const emptyRegistration: Registration = { email: '', displayName: '', password: '' };

function RegisterPage() {
  const [registration, setRegistration] = useState(emptyRegistration);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const mutation = useMutation({ mutationFn: registerUser });

  if (mutation.isSuccess) {
    // TODO: link to /login once US-02 is done
    return (
      <p className="rounded-lg border border-stone-200 bg-white px-4 py-3">
        Votre compte est créé.
      </p>
    );
  }

  const update = (field: Field) => (event: ChangeEvent<HTMLInputElement>) => {
    setRegistration({ ...registration, [field]: event.target.value });
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = registrationSchema.safeParse(registration);
    if (!result.success) {
      setFieldErrors(toFieldErrors(result.error.issues));
      return;
    }
    setFieldErrors({});
    mutation.mutate(result.data);
  };

  const isEmailTaken = mutation.error instanceof ApiError && mutation.error.status === 409;
  const formError = mutation.error && !isEmailTaken ? describeServerError(mutation.error) : null;

  return (
    <section className="mx-auto max-w-md">
      <h2 className="mb-4 text-xl font-semibold">Créer un compte</h2>
      <form
        noValidate
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-stone-200 bg-white px-4 py-5"
      >
        <TextField
          id="email"
          label="Adresse e-mail"
          type="email"
          autoComplete="email"
          value={registration.email}
          onChange={update('email')}
          error={
            fieldErrors.email ?? (isEmailTaken ? 'Un compte existe déjà avec cette adresse' : null)
          }
        />
        <TextField
          id="displayName"
          label="Nom affiché"
          autoComplete="nickname"
          value={registration.displayName}
          onChange={update('displayName')}
          error={fieldErrors.displayName}
        />
        <TextField
          id="password"
          label="Mot de passe"
          type={isPasswordVisible ? 'text' : 'password'}
          autoComplete="new-password"
          value={registration.password}
          onChange={update('password')}
          hint="12 caractères minimum"
          error={fieldErrors.password}
          action={
            <button
              type="button"
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              className="rounded-md border border-stone-300 px-3 text-sm text-stone-700 hover:bg-stone-100"
            >
              {isPasswordVisible ? 'Masquer' : 'Afficher'}
            </button>
          }
        />
        {formError && (
          <p role="alert" className="text-sm text-red-700">
            {formError}
          </p>
        )}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-md bg-stone-900 px-4 py-2 font-medium text-white hover:bg-stone-700 disabled:opacity-60"
        >
          {mutation.isPending ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>
    </section>
  );
}

interface TextFieldProps {
  id: Field;
  label: string;
  type?: string;
  autoComplete: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  hint?: string;
  error?: string | null;
  action?: ReactNode;
}

function TextField({ id, label, hint, error, action, ...inputProps }: TextFieldProps) {
  const descriptionId = `${id}-description`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          name={id}
          aria-invalid={Boolean(error)}
          aria-describedby={descriptionId}
          className="w-full rounded-md border border-stone-300 px-3 py-2 aria-invalid:border-red-600"
          {...inputProps}
        />
        {action}
      </div>
      <p id={descriptionId} className={`mt-1 text-sm ${error ? 'text-red-700' : 'text-stone-500'}`}>
        {error ?? hint}
      </p>
    </div>
  );
}

function toFieldErrors(issues: readonly { path: readonly PropertyKey[] }[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (field === 'email' || field === 'displayName' || field === 'password') {
      errors[field] = fieldErrorMessages[field];
    }
  }
  return errors;
}

function describeServerError(error: Error): string {
  if (error instanceof ApiError && error.status === 429) {
    return 'Trop de tentatives, réessayez dans une minute';
  }
  return 'Une erreur est survenue, réessayez plus tard';
}

import { registrationSchema, type Registration } from '@ardoise/types';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState, type ChangeEvent, type SubmitEvent } from 'react';
import { ApiError } from '../../api/api-error.ts';
import { registerUser } from '../../api/users.ts';
import { toFieldErrors } from '../../forms/field-errors.ts';
import { Alert } from '../../ui/alert.tsx';
import { Button } from '../../ui/button.tsx';
import { TextField } from '../../ui/text-field.tsx';

export const Route = createFileRoute('/_public/register')({
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
    return <Alert tone="success">Votre compte est créé.</Alert>;
  }

  const update = (field: Field) => (event: ChangeEvent<HTMLInputElement>) => {
    setRegistration({ ...registration, [field]: event.target.value });
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = registrationSchema.safeParse(registration);
    if (!result.success) {
      setFieldErrors(toFieldErrors(result.error.issues, fieldErrorMessages));
      return;
    }
    setFieldErrors({});
    mutation.mutate(result.data);
  };

  const isEmailTaken = mutation.error instanceof ApiError && mutation.error.status === 409;
  const formError = mutation.error && !isEmailTaken ? describeServerError(mutation.error) : null;

  return (
    <section>
      <h1 className="font-display text-3xl font-bold">Créer un compte</h1>
      <p className="mt-1 mb-6 text-ink-muted">Vos associations vous attendent de l'autre côté.</p>
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
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
            <Button variant="secondary" onClick={() => setIsPasswordVisible(!isPasswordVisible)}>
              {isPasswordVisible ? 'Masquer' : 'Afficher'}
            </Button>
          }
        />
        {formError && <Alert>{formError}</Alert>}
        <Button type="submit" isPending={mutation.isPending} className="w-full">
          {mutation.isPending ? 'Création…' : 'Créer mon compte'}
        </Button>
      </form>
    </section>
  );
}

function describeServerError(error: Error): string {
  if (error instanceof ApiError && error.status === 429) {
    return 'Trop de tentatives, réessayez dans une minute';
  }
  return 'Une erreur est survenue, réessayez plus tard';
}

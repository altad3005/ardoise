import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TextField } from './text-field.tsx';

describe('TextField', () => {
  it('is labelled', () => {
    render(<TextField id="email" label="Adresse e-mail" />);
    expect(screen.getByLabelText('Adresse e-mail')).toBe(screen.getByRole('textbox'));
  });

  it('is named after its id', () => {
    render(<TextField id="email" label="Adresse e-mail" />);
    expect(screen.getByLabelText('Adresse e-mail')).toHaveAttribute('name', 'email');
  });

  it('announces the error', () => {
    render(<TextField id="email" label="Adresse e-mail" error="Adresse e-mail invalide" />);
    const input = screen.getByLabelText('Adresse e-mail');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Adresse e-mail invalide');
  });

  it('shows the hint when there is no error', () => {
    render(<TextField id="password" label="Mot de passe" hint="12 caractères minimum" />);
    const input = screen.getByLabelText('Mot de passe');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).toHaveAccessibleDescription('12 caractères minimum');
  });

  it('prefers the error over the hint', () => {
    render(
      <TextField
        id="password"
        label="Mot de passe"
        hint="12 caractères minimum"
        error="Mot de passe trop court"
      />,
    );
    expect(screen.getByLabelText('Mot de passe')).toHaveAccessibleDescription(
      'Mot de passe trop court',
    );
  });

  it('has no description without hint or error', () => {
    render(<TextField id="email" label="Adresse e-mail" />);
    expect(screen.getByLabelText('Adresse e-mail')).not.toHaveAttribute('aria-describedby');
  });

  it('renders the action', () => {
    render(
      <TextField
        id="password"
        label="Mot de passe"
        action={<button type="button">Afficher</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Afficher' })).toBeInTheDocument();
  });
});

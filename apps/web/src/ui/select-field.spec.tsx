import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SelectField } from './select-field.tsx';

describe('SelectField', () => {
  it('is labelled', () => {
    render(
      <SelectField id="category" label="Catégorie">
        <option value="PILSNER">Pils</option>
      </SelectField>,
    );
    expect(screen.getByLabelText('Catégorie')).toBe(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: 'Pils' })).toBeInTheDocument();
  });

  it('is named after its id', () => {
    render(
      <SelectField id="category" label="Catégorie">
        <option value="PILSNER">Pils</option>
      </SelectField>,
    );
    expect(screen.getByLabelText('Catégorie')).toHaveAttribute('name', 'category');
  });

  it('announces the error', () => {
    render(
      <SelectField id="category" label="Catégorie" error="Choisissez une catégorie">
        <option value="PILSNER">Pils</option>
      </SelectField>,
    );
    const select = screen.getByLabelText('Catégorie');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAccessibleDescription('Choisissez une catégorie');
  });
});

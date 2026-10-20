import type { CatalogueSaleItem, SaleItemChanges } from '@ardoise/types';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/api-error.ts';
import { renderWithQueryClient } from '../test-utils.tsx';
import { SaleItemForm } from './sale-item-form.tsx';

const pastisBottle: CatalogueSaleItem = {
  id: 'e0000000-0000-4000-8000-000000000001',
  productId: 'c0000000-0000-4000-8000-000000000017',
  name: 'Ricard 1 L',
  consumedQuantity: 1,
  basePriceCents: null,
  isActive: true,
};

function saveMock() {
  return vi.fn<(changes: SaleItemChanges) => Promise<unknown>>(async () => ({}));
}

describe('SaleItemForm', () => {
  it('saves an item consuming a fraction, priced in euros', async () => {
    const save = saveMock();
    const onDone = vi.fn<() => void>();
    renderWithQueryClient(
      <SaleItemForm hasStock stockUnit="bouteille" save={save} onDone={onDone} />,
    );

    await userEvent.type(screen.getByLabelText('Nom'), 'Verre de pastis');
    await userEvent.type(screen.getByLabelText('Quantité consommée'), '1/20');
    await userEvent.type(screen.getByLabelText('Prix de base'), '2,00');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(save).toHaveBeenCalledWith({
      name: 'Verre de pastis',
      consumedQuantity: 0.05,
      basePriceCents: 200,
    });
  });

  it('saves a stockless item without quantity', async () => {
    const save = saveMock();
    renderWithQueryClient(<SaleItemForm hasStock={false} save={save} onDone={() => {}} />);

    expect(screen.queryByLabelText(/Quantité consommée/)).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Nom'), 'Entrée soirée');
    await userEvent.type(screen.getByLabelText('Prix de base'), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith({ name: 'Entrée soirée', basePriceCents: 500 }),
    );
  });

  it('starts from the edited item and requires its price', async () => {
    const save = saveMock();
    renderWithQueryClient(
      <SaleItemForm
        hasStock
        stockUnit="bouteille"
        initialItem={pastisBottle}
        save={save}
        onDone={() => {}}
      />,
    );

    expect(screen.getByLabelText('Nom')).toHaveValue('Ricard 1 L');
    expect(screen.getByLabelText('Quantité consommée')).toHaveValue('1');
    expect(screen.getByLabelText('Quantité consommée')).toHaveAccessibleDescription(
      'En bouteille, par exemple 1 ou 1/20',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(screen.getByLabelText('Prix de base')).toHaveAccessibleDescription(
      'Indiquez un prix en euros, par exemple 2,50',
    );
    expect(save).not.toHaveBeenCalled();
  });

  it('shows the price of the edited item in euros', () => {
    renderWithQueryClient(
      <SaleItemForm
        hasStock={false}
        initialItem={{
          ...pastisBottle,
          productId: null,
          consumedQuantity: null,
          basePriceCents: 250,
        }}
        save={saveMock()}
        onDone={() => {}}
      />,
    );

    expect(screen.getByLabelText('Prix de base')).toHaveValue('2,50');
  });

  it('explains that the name is already used', async () => {
    const save = vi.fn<(changes: SaleItemChanges) => Promise<unknown>>(async () => {
      throw new ApiError(409);
    });
    renderWithQueryClient(<SaleItemForm hasStock={false} save={save} onDone={() => {}} />);

    await userEvent.type(screen.getByLabelText('Nom'), 'Entrée soirée');
    await userEvent.type(screen.getByLabelText('Prix de base'), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() =>
      expect(screen.getByLabelText('Nom')).toHaveAccessibleDescription(
        'Un article porte déjà ce nom',
      ),
    );
  });
});

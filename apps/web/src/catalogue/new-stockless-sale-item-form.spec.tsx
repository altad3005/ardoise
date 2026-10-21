import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithQueryClient, stubFetch } from '../test-utils.tsx';
import { NewStocklessSaleItemForm } from './new-stockless-sale-item-form.tsx';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('NewStocklessSaleItemForm', () => {
  it('creates a stockless item then closes', async () => {
    const fetchMock = stubFetch(() =>
      jsonResponse(
        {
          id: 'e0000000-0000-4000-8000-000000000003',
          productId: null,
          name: 'Entrée soirée',
          consumedQuantity: null,
          basePriceCents: 500,
          isActive: true,
          menuPosition: null,
        },
        201,
      ),
    );
    const onClose = vi.fn<() => void>();
    renderWithQueryClient(<NewStocklessSaleItemForm onClose={onClose} />);

    expect(screen.queryByLabelText('Quantité consommée')).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Nom'), 'Entrée soirée');
    await userEvent.type(screen.getByLabelText('Prix de base'), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/management/stockless-sale-items',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Entrée soirée', basePriceCents: 500 }),
      }),
    );
  });
});

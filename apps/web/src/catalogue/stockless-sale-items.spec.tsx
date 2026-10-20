import type { CatalogueSaleItem } from '@ardoise/types';
import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithQueryClient, stubFetch } from '../test-utils.tsx';
import { StocklessSaleItems } from './stockless-sale-items.tsx';

const entryTicket: CatalogueSaleItem = {
  id: 'e0000000-0000-4000-8000-000000000003',
  productId: null,
  name: 'Entrée soirée',
  consumedQuantity: null,
  basePriceCents: 500,
  isActive: true,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('StocklessSaleItems', () => {
  it('lists the stockless items without consumption', async () => {
    stubFetch(() => jsonResponse([entryTicket]));
    renderWithQueryClient(<StocklessSaleItems />);

    const item = await screen.findByRole('listitem');
    expect(item).toHaveTextContent('Entrée soirée');
    expect(item).toHaveTextContent('5,00 €');
    expect(item).not.toHaveTextContent('consomme');
  });

  it('shows nothing when there is no stockless item', async () => {
    const fetchMock = stubFetch(() => jsonResponse([]));
    renderWithQueryClient(<StocklessSaleItems />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.queryByRole('heading', { name: 'Sans stock' })).not.toBeInTheDocument();
  });
});

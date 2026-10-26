import type { CatalogueProduct, CatalogueSaleItem } from '@ardoise/types';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithQueryClient, stubFetch } from '../test-utils.tsx';
import { ProductSaleItems } from './product-sale-items.tsx';

const ricard: CatalogueProduct = {
  id: 'c0000000-0000-4000-8000-000000000017',
  name: 'Ricard 1 L',
  category: 'SPIRIT',
  stockUnit: 'bouteille',
  isShared: true,
  isActive: true,
};

const glass: CatalogueSaleItem = {
  id: 'e0000000-0000-4000-8000-000000000002',
  productId: ricard.id,
  name: 'Verre de pastis',
  consumedQuantity: 0.05,
  basePriceCents: 200,
  isActive: true,
  menuPosition: 0,
};

const bottle: CatalogueSaleItem = {
  id: 'e0000000-0000-4000-8000-000000000001',
  productId: ricard.id,
  name: 'Ricard 1 L',
  consumedQuantity: 1,
  basePriceCents: null,
  isActive: true,
  menuPosition: null,
};

const saleItemsUrl = `/api/management/products/${ricard.id}/sale-items`;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ProductSaleItems', () => {
  it('explains what the sale section is for', async () => {
    stubFetch(() => jsonResponse([]));
    renderWithQueryClient(<ProductSaleItems product={ricard} />);

    expect(await screen.findByRole('heading', { name: 'Vente' })).toBeInTheDocument();
    expect(screen.getByText('Ce que vous servez au bar, et à quel prix.')).toBeInTheDocument();
  });

  it('lists the items with their consumption and price', async () => {
    stubFetch(() => jsonResponse([glass, bottle]));
    renderWithQueryClient(<ProductSaleItems product={ricard} />);

    const items = within(await screen.findByRole('list', { name: 'Articles de vente' }));
    const [glassItem, bottleItem] = items.getAllByRole('listitem');
    expect(glassItem).toHaveTextContent('Verre de pastis');
    expect(glassItem).toHaveTextContent('consomme 0,05 bouteille');
    expect(glassItem).toHaveTextContent('2,00 €');
    expect(glassItem).toHaveTextContent('sur la carte');
    expect(bottleItem).toHaveTextContent('prix à fixer');
    expect(bottleItem).toHaveTextContent('hors carte');
  });

  it('sets the price of an item', async () => {
    const fetchMock = stubFetch((_url, init) =>
      init?.method === 'PUT'
        ? jsonResponse({ ...bottle, basePriceCents: 2800 })
        : jsonResponse([bottle]),
    );
    renderWithQueryClient(<ProductSaleItems product={ricard} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Modifier Ricard 1 L' }));
    await userEvent.type(screen.getByLabelText('Prix de base'), '28');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/management/sale-items/${bottle.id}`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Ricard 1 L', consumedQuantity: 1, basePriceCents: 2800 }),
        }),
      ),
    );
    await waitFor(() => expect(screen.queryByLabelText('Prix de base')).not.toBeInTheDocument());
  });

  it('creates an item for the product', async () => {
    const fetchMock = stubFetch((_url, init) =>
      init?.method === 'POST' ? jsonResponse(glass, 201) : jsonResponse([bottle]),
    );
    renderWithQueryClient(<ProductSaleItems product={ricard} />);

    await userEvent.click(await screen.findByRole('button', { name: '+ Article de vente' }));
    await userEvent.type(screen.getByLabelText('Nom'), 'Verre de pastis');
    await userEvent.type(screen.getByLabelText('Quantité consommée'), '1/20');
    await userEvent.type(screen.getByLabelText('Prix de base'), '2');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        saleItemsUrl,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'Verre de pastis',
            consumedQuantity: 0.05,
            basePriceCents: 200,
          }),
        }),
      ),
    );
  });

  it('asks to activate an inactive product before creating items', async () => {
    stubFetch(() => jsonResponse([]));
    renderWithQueryClient(<ProductSaleItems product={{ ...ricard, isActive: false }} />);

    expect(
      await screen.findByText('Activez le produit pour lui créer des articles'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ Article de vente' })).not.toBeInTheDocument();
  });
});

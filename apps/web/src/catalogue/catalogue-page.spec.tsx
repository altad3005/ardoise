import type { CatalogueProduct } from '@ardoise/types';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithQueryClient, stubFetch } from '../test-utils.tsx';
import { CataloguePage } from './catalogue-page.tsx';

const jupiler: CatalogueProduct = {
  id: 'c0000000-0000-4000-8000-000000000001',
  name: 'Jupiler 25 cl',
  category: 'PILSNER',
  stockUnit: 'bouteille',
  isShared: true,
  isActive: true,
};

const duvel: CatalogueProduct = {
  id: 'c0000000-0000-4000-8000-000000000005',
  name: 'Duvel 33 cl',
  category: 'SPECIALTY_BEER',
  stockUnit: 'bouteille',
  isShared: true,
  isActive: false,
};

const stubCatalogueApi = (products: CatalogueProduct[]) =>
  stubFetch((url) => jsonResponse(url.endsWith('/products') ? products : []));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Catalogue page', () => {
  it('opens and closes the panel of a product', async () => {
    stubFetch((url) => jsonResponse(url.endsWith('/products') ? [jupiler] : []));
    renderWithQueryClient(<CataloguePage />);
    const productButton = await screen.findByRole('button', { name: 'Jupiler 25 cl bouteille' });

    await userEvent.click(productButton);

    expect(productButton).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByText("Conditionnements d'achat")).toBeInTheDocument();

    await userEvent.click(productButton);

    expect(productButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText("Conditionnements d'achat")).not.toBeInTheDocument();
  });

  it('opens the stockless item form above the products', async () => {
    stubFetch((url) => jsonResponse(url.endsWith('/products') ? [jupiler] : []));
    renderWithQueryClient(<CataloguePage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Nouvel article sans stock' }));

    const nameField = screen.getByLabelText('Nom');
    const firstCategory = screen.getByRole('heading', { name: 'Pils' });
    expect(
      nameField.compareDocumentPosition(firstCategory) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('lists only the activated products, without filters', async () => {
    stubCatalogueApi([jupiler, duvel]);
    renderWithQueryClient(<CataloguePage />);

    expect(
      await screen.findByRole('button', { name: 'Jupiler 25 cl bouteille' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Duvel 33 cl')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tous' })).not.toBeInTheDocument();
  });

  it('searches only the products not activated yet', async () => {
    stubCatalogueApi([jupiler, duvel]);
    renderWithQueryClient(<CataloguePage />);
    const search = await screen.findByRole('combobox', { name: 'Activer un produit' });

    await userEvent.type(search, 'jupi');

    expect(screen.getByText('Aucun résultat')).toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.type(search, 'duv');

    expect(screen.getByRole('option', { name: /Duvel 33 cl/ })).toHaveTextContent(
      'Bières spéciales · commun',
    );
  });

  it('activates the product chosen in the search', async () => {
    const fetchMock = stubCatalogueApi([jupiler, duvel]);
    renderWithQueryClient(<CataloguePage />);

    await userEvent.type(
      await screen.findByRole('combobox', { name: 'Activer un produit' }),
      'duvel',
    );
    await userEvent.click(screen.getByRole('option', { name: /Duvel 33 cl/ }));

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/management/products/${duvel.id}/activation`,
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('guides an association without any activated product', async () => {
    stubCatalogueApi([duvel]);
    renderWithQueryClient(<CataloguePage />);

    expect(await screen.findByText(/Aucun produit activé/)).toBeInTheDocument();
  });
});

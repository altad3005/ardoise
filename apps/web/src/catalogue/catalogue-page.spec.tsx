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
});

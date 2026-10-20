import type { CatalogueProduct, PurchasePackaging } from '@ardoise/types';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithQueryClient, stubFetch } from '../test-utils.tsx';
import { ProductPanel } from './product-panel.tsx';

const jupiler: CatalogueProduct = {
  id: 'c0000000-0000-4000-8000-000000000001',
  name: 'Jupiler 25 cl',
  category: 'PILSNER',
  stockUnit: 'bouteille',
  isShared: true,
  isActive: true,
};

const ownPack: PurchasePackaging = {
  id: 'd0000000-0000-4000-8000-000000000042',
  label: 'pack de 12',
  unitCount: 12,
  isShared: false,
};

const sharedCrate: PurchasePackaging = {
  id: 'd0000000-0000-4000-8000-000000000001',
  label: 'bac de 24',
  unitCount: 24,
  isShared: true,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ProductPanel', () => {
  it('lists the packagings with their unit count', async () => {
    stubFetch(() => jsonResponse([ownPack, sharedCrate]));
    renderWithQueryClient(<ProductPanel product={jupiler} />);

    const packagings = await screen.findByRole('list', { name: "Conditionnements d'achat" });
    const [ownItem, sharedItem] = within(packagings).getAllByRole('listitem');
    expect(ownItem).toHaveTextContent('pack de 12 — 12 unités');
    expect(sharedItem).toHaveTextContent('bac de 24 — 24 unitéscommun');
  });

  it('only lets an own packaging be deleted', async () => {
    const fetchMock = stubFetch((_url, init) =>
      init?.method === 'DELETE'
        ? new Response(null, { status: 204 })
        : jsonResponse([ownPack, sharedCrate]),
    );
    renderWithQueryClient(<ProductPanel product={jupiler} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Supprimer pack de 12' }));

    expect(screen.queryByRole('button', { name: 'Supprimer bac de 24' })).not.toBeInTheDocument();
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/management/products/${jupiler.id}/packagings/${ownPack.id}`,
        { method: 'DELETE' },
      ),
    );
  });

  it('says when the product has no packaging', async () => {
    stubFetch(() => jsonResponse([]));
    renderWithQueryClient(<ProductPanel product={jupiler} />);

    expect(await screen.findByText('Aucun conditionnement : achat à l’unité')).toBeInTheDocument();
  });

  it('opens the packaging form', async () => {
    stubFetch(() => jsonResponse([]));
    renderWithQueryClient(<ProductPanel product={jupiler} />);

    await userEvent.click(await screen.findByRole('button', { name: '+ Conditionnement' }));

    expect(screen.getByLabelText('Libellé')).toBeInTheDocument();
  });
});

import type { CatalogueSaleItem } from '@ardoise/types';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithQueryClient, stubFetch } from '../test-utils.tsx';
import { MenuEditor } from './menu-editor.tsx';

const beer: CatalogueSaleItem = {
  id: 'e0000000-0000-4000-8000-000000000001',
  productId: 'c0000000-0000-4000-8000-000000000001',
  name: 'Jupiler 25 cl',
  consumedQuantity: 1,
  basePriceCents: 150,
  isActive: true,
  menuPosition: 0,
};

const pastisGlass: CatalogueSaleItem = {
  id: 'e0000000-0000-4000-8000-000000000002',
  productId: 'c0000000-0000-4000-8000-000000000017',
  name: 'Verre de pastis',
  consumedQuantity: 0.05,
  basePriceCents: null,
  isActive: true,
  menuPosition: 1,
};

const entryTicket: CatalogueSaleItem = {
  id: 'e0000000-0000-4000-8000-000000000003',
  productId: null,
  name: 'Entrée soirée',
  consumedQuantity: null,
  basePriceCents: 500,
  isActive: true,
  menuPosition: null,
};

const retiredTicket: CatalogueSaleItem = {
  ...entryTicket,
  id: 'e0000000-0000-4000-8000-000000000004',
  name: 'Ancien ticket',
  isActive: false,
};

const menuUrl = '/api/management/menu';

function stubMenuApi({ failsToCompose = false } = {}) {
  return stubFetch((url, init) => {
    if (init?.method === 'PUT') {
      return failsToCompose ? jsonResponse({}, 500) : jsonResponse([]);
    }
    return jsonResponse(
      url === menuUrl ? [beer, pastisGlass] : [retiredTicket, entryTicket, beer, pastisGlass],
    );
  });
}

function composition(saleItemIds: string[]) {
  return expect.objectContaining({ method: 'PUT', body: JSON.stringify({ saleItemIds }) });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MenuEditor', () => {
  it('lists the menu in display order with the base prices', async () => {
    stubMenuApi();
    renderWithQueryClient(<MenuEditor />);

    const menu = within(await screen.findByRole('list', { name: 'Carte de la caisse' }));
    const [first, second] = menu.getAllByRole('listitem');
    expect(first).toHaveTextContent('Jupiler 25 cl');
    expect(first).toHaveTextContent('1,50 €');
    expect(second).toHaveTextContent('Verre de pastis');
    expect(second).toHaveTextContent('prix à fixer');
  });

  it('cannot move the first item up nor the last one down', async () => {
    stubMenuApi();
    renderWithQueryClient(<MenuEditor />);

    expect(await screen.findByRole('button', { name: 'Monter Jupiler 25 cl' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Descendre Verre de pastis' })).toBeDisabled();
  });

  it('moves an item up', async () => {
    const fetchMock = stubMenuApi();
    renderWithQueryClient(<MenuEditor />);

    await userEvent.click(await screen.findByRole('button', { name: 'Monter Verre de pastis' }));

    expect(fetchMock).toHaveBeenCalledWith(menuUrl, composition([pastisGlass.id, beer.id]));
  });

  it('moves an item down', async () => {
    const fetchMock = stubMenuApi();
    renderWithQueryClient(<MenuEditor />);

    await userEvent.click(await screen.findByRole('button', { name: 'Descendre Jupiler 25 cl' }));

    expect(fetchMock).toHaveBeenCalledWith(menuUrl, composition([pastisGlass.id, beer.id]));
  });

  it('takes an item off the menu', async () => {
    const fetchMock = stubMenuApi();
    renderWithQueryClient(<MenuEditor />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Retirer Jupiler 25 cl de la carte' }),
    );

    expect(fetchMock).toHaveBeenCalledWith(menuUrl, composition([pastisGlass.id]));
  });

  it('searches only the active items off the menu', async () => {
    stubMenuApi();
    renderWithQueryClient(<MenuEditor />);

    await userEvent.type(await screen.findByRole('combobox', { name: 'Ajouter un article' }), 't');

    const suggestions = screen.getAllByRole('option');
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toHaveTextContent('Entrée soirée');
    expect(suggestions[0]).toHaveTextContent('5,00 €');
  });

  it('adds the chosen item at the end of the menu', async () => {
    const fetchMock = stubMenuApi();
    renderWithQueryClient(<MenuEditor />);

    await userEvent.type(
      await screen.findByRole('combobox', { name: 'Ajouter un article' }),
      'entree',
    );
    await userEvent.click(screen.getByRole('option', { name: /Entrée soirée/ }));

    expect(fetchMock).toHaveBeenCalledWith(
      menuUrl,
      composition([beer.id, pastisGlass.id, entryTicket.id]),
    );
  });

  it('places the search above the menu', async () => {
    stubMenuApi();
    renderWithQueryClient(<MenuEditor />);

    const search = await screen.findByRole('combobox', { name: 'Ajouter un article' });
    const menu = screen.getByRole('list', { name: 'Carte de la caisse' });
    expect(search.compareDocumentPosition(menu) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('warns when the menu could not be saved', async () => {
    stubMenuApi({ failsToCompose: true });
    renderWithQueryClient(<MenuEditor />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Retirer Jupiler 25 cl de la carte' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Une erreur est survenue');
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import {
  SaleItemInactiveError,
  SaleItemNotFoundError,
  type SaleItem,
} from '../domain/sale-item.js';
import { InMemorySaleItemRepository } from '../infrastructure/in-memory-sale-item.repository.js';
import { ComposeMenu } from './compose-menu.use-case.js';
import { GetMenu } from './get-menu.use-case.js';

const associationId = 'a55c1a7e-0000-4000-8000-000000000001';
const otherAssociationId = 'b0000000-0000-4000-8000-000000000002';

const beer: SaleItem = {
  id: 'e0000000-0000-4000-8000-000000000001',
  associationId,
  productId: 'c0000000-0000-4000-8000-000000000001',
  name: 'Jupiler 25 cl',
  consumedQuantity: 1,
  basePriceCents: 150,
  isActive: true,
  menuPosition: 1,
};

const pastisGlass: SaleItem = {
  id: 'e0000000-0000-4000-8000-000000000002',
  associationId,
  productId: 'c0000000-0000-4000-8000-000000000017',
  name: 'Verre de pastis',
  consumedQuantity: 0.05,
  basePriceCents: 200,
  isActive: true,
  menuPosition: 0,
};

const entryTicket: SaleItem = {
  id: 'e0000000-0000-4000-8000-000000000003',
  associationId,
  productId: null,
  name: 'Entrée soirée',
  consumedQuantity: null,
  basePriceCents: 500,
  isActive: true,
  menuPosition: null,
};

const retiredItem: SaleItem = {
  ...entryTicket,
  id: 'e0000000-0000-4000-8000-000000000004',
  name: 'Ancien ticket',
  isActive: false,
};

const otherAssociationItem: SaleItem = {
  ...entryTicket,
  id: 'e0000000-0000-4000-8000-000000000005',
  associationId: otherAssociationId,
  menuPosition: 0,
};

let saleItems: InMemorySaleItemRepository;

beforeEach(() => {
  saleItems = new InMemorySaleItemRepository([
    beer,
    pastisGlass,
    entryTicket,
    retiredItem,
    otherAssociationItem,
  ]);
});

describe('GetMenu', () => {
  it('lists the items on the menu of the association, in display order', async () => {
    expect(await new GetMenu(saleItems).execute(associationId)).toEqual([pastisGlass, beer]);
  });
});

describe('ComposeMenu', () => {
  let composeMenu: ComposeMenu;

  beforeEach(() => {
    composeMenu = new ComposeMenu(saleItems);
  });

  it('puts the items on the menu in the given order', async () => {
    const menu = await composeMenu.execute(associationId, [
      entryTicket.id,
      beer.id,
      pastisGlass.id,
    ]);

    expect(menu).toEqual([
      { ...entryTicket, menuPosition: 0 },
      { ...beer, menuPosition: 1 },
      { ...pastisGlass, menuPosition: 2 },
    ]);
    expect(await new GetMenu(saleItems).execute(associationId)).toEqual(menu);
  });

  it('takes the items left out off the menu', async () => {
    await composeMenu.execute(associationId, [beer.id]);

    expect(await saleItems.findById(associationId, pastisGlass.id)).toEqual({
      ...pastisGlass,
      menuPosition: null,
    });
  });

  it('empties the menu', async () => {
    expect(await composeMenu.execute(associationId, [])).toEqual([]);
  });

  it('leaves the menu of other associations untouched', async () => {
    await composeMenu.execute(associationId, []);

    expect(await new GetMenu(saleItems).execute(otherAssociationId)).toEqual([
      otherAssociationItem,
    ]);
  });

  it('rejects an item of another association', async () => {
    await expect(
      composeMenu.execute(associationId, [beer.id, otherAssociationItem.id]),
    ).rejects.toBeInstanceOf(SaleItemNotFoundError);
    expect(await new GetMenu(saleItems).execute(associationId)).toEqual([pastisGlass, beer]);
  });

  it('rejects an inactive item', async () => {
    await expect(composeMenu.execute(associationId, [retiredItem.id])).rejects.toBeInstanceOf(
      SaleItemInactiveError,
    );
  });
});

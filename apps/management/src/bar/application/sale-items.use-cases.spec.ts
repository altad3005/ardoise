import { beforeEach, describe, expect, it } from 'vitest';
import { ProductNotFoundError, type Product } from '../domain/product.js';
import {
  SaleItemConsumptionMismatchError,
  SaleItemNameAlreadyUsedError,
  SaleItemNotFoundError,
  type SaleItem,
} from '../domain/sale-item.js';
import { InMemoryProductRepository } from '../infrastructure/in-memory-product.repository.js';
import { InMemorySaleItemRepository } from '../infrastructure/in-memory-sale-item.repository.js';
import { ActivateProduct } from './activate-product.use-case.js';
import { CreateSaleItem } from './create-sale-item.use-case.js';
import { CreateStocklessSaleItem } from './create-stockless-sale-item.use-case.js';
import { ListProductSaleItems } from './list-product-sale-items.use-case.js';
import { ListStocklessSaleItems } from './list-stockless-sale-items.use-case.js';
import { UpdateSaleItem } from './update-sale-item.use-case.js';

const associationId = 'a55c1a7e-0000-4000-8000-000000000001';
const otherAssociationId = 'b0000000-0000-4000-8000-000000000002';

const pastis: Product = {
  id: 'c0000000-0000-4000-8000-000000000017',
  associationId: null,
  name: 'Ricard 1 L',
  category: 'SPIRIT',
  stockUnit: 'bouteille',
};

const inactiveWine: Product = {
  id: 'c0000000-0000-4000-8000-000000000022',
  associationId: null,
  name: 'Vin rouge 75 cl',
  category: 'WINE',
  stockUnit: 'bouteille',
};

const otherAssociationBeer: Product = {
  id: 'c0000000-0000-4000-8000-000000000099',
  associationId: otherAssociationId,
  name: 'Bière du club 33 cl',
  category: 'PILSNER',
  stockUnit: 'bouteille',
};

const pastisBottle: SaleItem = {
  id: 'e0000000-0000-4000-8000-000000000001',
  associationId,
  productId: pastis.id,
  name: 'Ricard 1 L',
  consumedQuantity: 1,
  basePriceCents: null,
  isActive: true,
};

const entryTicket: SaleItem = {
  id: 'e0000000-0000-4000-8000-000000000002',
  associationId,
  productId: null,
  name: 'Entrée soirée',
  consumedQuantity: null,
  basePriceCents: 500,
  isActive: true,
};

const otherAssociationTicket: SaleItem = {
  ...entryTicket,
  id: 'e0000000-0000-4000-8000-000000000003',
  associationId: otherAssociationId,
  name: 'Ticket brunch',
};

let products: InMemoryProductRepository;
let saleItems: InMemorySaleItemRepository;

beforeEach(async () => {
  products = new InMemoryProductRepository([pastis, inactiveWine, otherAssociationBeer]);
  await new ActivateProduct(products).execute(associationId, pastis.id);
  saleItems = new InMemorySaleItemRepository([pastisBottle, entryTicket, otherAssociationTicket]);
});

describe('CreateSaleItem', () => {
  let createSaleItem: CreateSaleItem;

  beforeEach(() => {
    createSaleItem = new CreateSaleItem(products, saleItems);
  });

  it('creates a priced item consuming a fraction of an active product', async () => {
    const created = await createSaleItem.execute(associationId, pastis.id, {
      name: 'Verre de pastis',
      consumedQuantity: 0.05,
      basePriceCents: 200,
    });

    expect(created).toEqual({
      id: created.id,
      associationId,
      productId: pastis.id,
      name: 'Verre de pastis',
      consumedQuantity: 0.05,
      basePriceCents: 200,
      isActive: true,
    });
  });

  it('rejects an inactive product', async () => {
    await expect(
      createSaleItem.execute(associationId, inactiveWine.id, {
        name: 'Verre de vin',
        consumedQuantity: 0.2,
        basePriceCents: 200,
      }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('rejects a product owned by another association', async () => {
    await expect(
      createSaleItem.execute(associationId, otherAssociationBeer.id, {
        name: 'Bière du club',
        consumedQuantity: 1,
        basePriceCents: 200,
      }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('rejects the name of another item of the association, ignoring case', async () => {
    await expect(
      createSaleItem.execute(associationId, pastis.id, {
        name: 'ENTRÉE SOIRÉE',
        consumedQuantity: 1,
        basePriceCents: 200,
      }),
    ).rejects.toBeInstanceOf(SaleItemNameAlreadyUsedError);
  });
});

describe('CreateStocklessSaleItem', () => {
  it('creates an item consuming no product', async () => {
    const created = await new CreateStocklessSaleItem(saleItems).execute(associationId, {
      name: 'Ticket brunch',
      basePriceCents: 800,
    });

    expect(created).toEqual({
      id: created.id,
      associationId,
      productId: null,
      name: 'Ticket brunch',
      consumedQuantity: null,
      basePriceCents: 800,
      isActive: true,
    });
  });

  it('rejects a name already used', async () => {
    await expect(
      new CreateStocklessSaleItem(saleItems).execute(associationId, {
        name: entryTicket.name,
        basePriceCents: 800,
      }),
    ).rejects.toBeInstanceOf(SaleItemNameAlreadyUsedError);
  });
});

describe('ListProductSaleItems', () => {
  it('lists the items of a product, smallest consumption first', async () => {
    const glass = await new CreateSaleItem(products, saleItems).execute(associationId, pastis.id, {
      name: 'Verre de pastis',
      consumedQuantity: 0.05,
      basePriceCents: 200,
    });

    const listed = await new ListProductSaleItems(products, saleItems).execute(
      associationId,
      pastis.id,
    );

    expect(listed).toEqual([glass, pastisBottle]);
  });

  it('rejects a product owned by another association', async () => {
    await expect(
      new ListProductSaleItems(products, saleItems).execute(associationId, otherAssociationBeer.id),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });
});

describe('ListStocklessSaleItems', () => {
  it('lists only the stockless items of the association', async () => {
    expect(await new ListStocklessSaleItems(saleItems).execute(associationId)).toEqual([
      entryTicket,
    ]);
  });
});

describe('UpdateSaleItem', () => {
  let updateSaleItem: UpdateSaleItem;

  beforeEach(() => {
    updateSaleItem = new UpdateSaleItem(saleItems);
  });

  it('sets the price of the item created with its product', async () => {
    const updated = await updateSaleItem.execute(associationId, pastisBottle.id, {
      name: 'Bouteille de pastis',
      consumedQuantity: 1,
      basePriceCents: 2800,
    });

    expect(updated).toEqual({
      ...pastisBottle,
      name: 'Bouteille de pastis',
      basePriceCents: 2800,
    });
    expect(await saleItems.findById(associationId, pastisBottle.id)).toEqual(updated);
  });

  it('keeps its own name', async () => {
    const updated = await updateSaleItem.execute(associationId, entryTicket.id, {
      name: 'entrée soirée',
      basePriceCents: 600,
    });

    expect(updated.basePriceCents).toBe(600);
  });

  it('rejects the name of another item', async () => {
    await expect(
      updateSaleItem.execute(associationId, entryTicket.id, {
        name: pastisBottle.name,
        basePriceCents: 600,
      }),
    ).rejects.toBeInstanceOf(SaleItemNameAlreadyUsedError);
  });

  it('requires a consumed quantity for an item with stock', async () => {
    await expect(
      updateSaleItem.execute(associationId, pastisBottle.id, {
        name: pastisBottle.name,
        basePriceCents: 2800,
      }),
    ).rejects.toBeInstanceOf(SaleItemConsumptionMismatchError);
  });

  it('refuses a consumed quantity for a stockless item', async () => {
    await expect(
      updateSaleItem.execute(associationId, entryTicket.id, {
        name: entryTicket.name,
        consumedQuantity: 1,
        basePriceCents: 600,
      }),
    ).rejects.toBeInstanceOf(SaleItemConsumptionMismatchError);
  });

  it('rejects an item of another association', async () => {
    await expect(
      updateSaleItem.execute(associationId, otherAssociationTicket.id, {
        name: 'Ticket brunch',
        basePriceCents: 600,
      }),
    ).rejects.toBeInstanceOf(SaleItemNotFoundError);
  });
});

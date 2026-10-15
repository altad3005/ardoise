import { beforeEach, describe, expect, it } from 'vitest';
import { ProductNotFoundError, type Product } from '../domain/product.js';
import { InMemoryProductRepository } from '../infrastructure/in-memory-product.repository.js';
import { ActivateProduct } from './activate-product.use-case.js';
import { DeactivateProduct } from './deactivate-product.use-case.js';
import { ListProducts } from './list-products.use-case.js';

const associationId = 'a55c1a7e-0000-4000-8000-000000000001';

const jupiler: Product = {
  id: 'c0000000-0000-4000-8000-000000000001',
  associationId: null,
  name: 'Jupiler 25 cl',
  category: 'BEER',
  stockUnit: 'bouteille',
};

const otherAssociationBeer: Product = {
  id: 'c0000000-0000-4000-8000-000000000099',
  associationId: 'b0000000-0000-4000-8000-000000000002',
  name: 'Bière du club 33 cl',
  category: 'BEER',
  stockUnit: 'bouteille',
};

describe('ActivateProduct', () => {
  let products: InMemoryProductRepository;
  let activateProduct: ActivateProduct;

  beforeEach(() => {
    products = new InMemoryProductRepository([jupiler, otherAssociationBeer]);
    activateProduct = new ActivateProduct(products);
  });

  it('activates a shared product with an unpriced one-unit sale item', async () => {
    await activateProduct.execute(associationId, jupiler.id);

    const listed = await new ListProducts(products).execute(associationId);
    expect(listed.find((product) => product.id === jupiler.id)?.isActive).toBe(true);
    expect(products.saleItems).toEqual([
      {
        associationId,
        productId: jupiler.id,
        name: 'Jupiler 25 cl',
        consumedQuantity: '1',
        basePriceCents: null,
        isActive: true,
      },
    ]);
  });

  it('creates a single sale item when activated twice', async () => {
    await activateProduct.execute(associationId, jupiler.id);
    await activateProduct.execute(associationId, jupiler.id);

    expect(products.saleItems).toHaveLength(1);
  });

  it('creates no second sale item when reactivated', async () => {
    await activateProduct.execute(associationId, jupiler.id);
    await new DeactivateProduct(products).execute(associationId, jupiler.id);
    await activateProduct.execute(associationId, jupiler.id);

    expect(products.saleItems).toHaveLength(1);
    expect((await products.findVisibleById(associationId, jupiler.id))?.isActive).toBe(true);
  });

  it('rejects an unknown product', async () => {
    await expect(
      activateProduct.execute(associationId, 'c0000000-0000-4000-8000-000000000098'),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('rejects a product owned by another association', async () => {
    await expect(
      activateProduct.execute(associationId, otherAssociationBeer.id),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
    expect(products.saleItems).toHaveLength(0);
  });
});

describe('DeactivateProduct', () => {
  let products: InMemoryProductRepository;
  let deactivateProduct: DeactivateProduct;

  beforeEach(() => {
    products = new InMemoryProductRepository([jupiler, otherAssociationBeer]);
    deactivateProduct = new DeactivateProduct(products);
  });

  it('deactivates an active product', async () => {
    await new ActivateProduct(products).execute(associationId, jupiler.id);

    await deactivateProduct.execute(associationId, jupiler.id);

    expect((await products.findVisibleById(associationId, jupiler.id))?.isActive).toBe(false);
  });

  it('rejects an unknown product', async () => {
    await expect(
      deactivateProduct.execute(associationId, otherAssociationBeer.id),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });
});

describe('ListProducts', () => {
  it('lists shared and own products, not those of other associations, inactive by default', async () => {
    const ownBeer: Product = {
      ...otherAssociationBeer,
      id: 'c0000000-0000-4000-8000-000000000097',
      associationId,
    };
    const products = new InMemoryProductRepository([jupiler, otherAssociationBeer, ownBeer]);

    const listed = await new ListProducts(products).execute(associationId);

    expect(listed.map((product) => [product.id, product.isActive])).toEqual([
      [ownBeer.id, false],
      [jupiler.id, false],
    ]);
  });
});

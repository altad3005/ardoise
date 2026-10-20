import { beforeEach, describe, expect, it } from 'vitest';
import {
  PackagingLabelAlreadyUsedError,
  PackagingNotFoundError,
  type Packaging,
} from '../domain/packaging.js';
import { ProductNotFoundError, type Product } from '../domain/product.js';
import { InMemoryPackagingRepository } from '../infrastructure/in-memory-packaging.repository.js';
import { InMemoryProductRepository } from '../infrastructure/in-memory-product.repository.js';
import { CreatePackaging } from './create-packaging.use-case.js';
import { DeletePackaging } from './delete-packaging.use-case.js';
import { ListPackagings } from './list-packagings.use-case.js';

const associationId = 'a55c1a7e-0000-4000-8000-000000000001';
const otherAssociationId = 'b0000000-0000-4000-8000-000000000002';

const jupiler: Product = {
  id: 'c0000000-0000-4000-8000-000000000001',
  associationId: null,
  name: 'Jupiler 25 cl',
  category: 'PILSNER',
  stockUnit: 'bouteille',
};

const otherAssociationBeer: Product = {
  id: 'c0000000-0000-4000-8000-000000000099',
  associationId: otherAssociationId,
  name: 'Bière du club 33 cl',
  category: 'PILSNER',
  stockUnit: 'bouteille',
};

const sharedCrate: Packaging = {
  id: 'd0000000-0000-4000-8000-000000000001',
  productId: jupiler.id,
  associationId: null,
  label: 'bac de 24',
  unitCount: 24,
};

const ownPack: Packaging = {
  id: 'd0000000-0000-4000-8000-000000000002',
  productId: jupiler.id,
  associationId,
  label: 'pack de 12',
  unitCount: 12,
};

const otherAssociationPack: Packaging = {
  id: 'd0000000-0000-4000-8000-000000000003',
  productId: jupiler.id,
  associationId: otherAssociationId,
  label: 'pack de 6',
  unitCount: 6,
};

let products: InMemoryProductRepository;
let packagings: InMemoryPackagingRepository;

beforeEach(() => {
  products = new InMemoryProductRepository([jupiler, otherAssociationBeer]);
  packagings = new InMemoryPackagingRepository([sharedCrate, ownPack, otherAssociationPack]);
});

describe('ListPackagings', () => {
  it('lists shared and own packagings of a product, smallest first', async () => {
    const listed = await new ListPackagings(products, packagings).execute(
      associationId,
      jupiler.id,
    );

    expect(listed).toEqual([ownPack, sharedCrate]);
  });

  it('rejects a product owned by another association', async () => {
    await expect(
      new ListPackagings(products, packagings).execute(associationId, otherAssociationBeer.id),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });
});

describe('CreatePackaging', () => {
  let createPackaging: CreatePackaging;

  beforeEach(() => {
    createPackaging = new CreatePackaging(products, packagings);
  });

  it('creates an own packaging on a shared product', async () => {
    const created = await createPackaging.execute(associationId, jupiler.id, {
      label: 'plateau de 6',
      unitCount: 6,
    });

    expect(created).toEqual({
      id: created.id,
      productId: jupiler.id,
      associationId,
      label: 'plateau de 6',
      unitCount: 6,
    });
    expect(await packagings.findVisible(associationId, jupiler.id)).toContainEqual(created);
  });

  it('accepts a label used by another association', async () => {
    const created = await createPackaging.execute(associationId, jupiler.id, {
      label: otherAssociationPack.label,
      unitCount: 6,
    });

    expect(created.associationId).toBe(associationId);
  });

  it('rejects the label of a shared packaging, ignoring case', async () => {
    await expect(
      createPackaging.execute(associationId, jupiler.id, { label: 'BAC DE 24', unitCount: 24 }),
    ).rejects.toBeInstanceOf(PackagingLabelAlreadyUsedError);
  });

  it('rejects a product owned by another association', async () => {
    await expect(
      createPackaging.execute(associationId, otherAssociationBeer.id, {
        label: 'bac de 24',
        unitCount: 24,
      }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });
});

describe('DeletePackaging', () => {
  let deletePackaging: DeletePackaging;

  beforeEach(() => {
    deletePackaging = new DeletePackaging(packagings);
  });

  it('deletes an own packaging', async () => {
    await deletePackaging.execute(associationId, jupiler.id, ownPack.id);

    expect(await packagings.findVisible(associationId, jupiler.id)).toEqual([sharedCrate]);
  });

  it('refuses to delete a shared packaging', async () => {
    await expect(
      deletePackaging.execute(associationId, jupiler.id, sharedCrate.id),
    ).rejects.toBeInstanceOf(PackagingNotFoundError);
    expect(await packagings.findVisible(associationId, jupiler.id)).toContainEqual(sharedCrate);
  });

  it('refuses to delete a packaging of another association', async () => {
    await expect(
      deletePackaging.execute(associationId, jupiler.id, otherAssociationPack.id),
    ).rejects.toBeInstanceOf(PackagingNotFoundError);
  });

  it('refuses a packaging requested through another product', async () => {
    await expect(
      deletePackaging.execute(associationId, otherAssociationBeer.id, ownPack.id),
    ).rejects.toBeInstanceOf(PackagingNotFoundError);
  });
});

import type { Packaging } from './packaging.js';

export abstract class PackagingRepository {
  abstract findVisible(associationId: string, productId: string): Promise<Packaging[]>;

  abstract existsVisibleWithLabel(
    associationId: string,
    productId: string,
    label: string,
  ): Promise<boolean>;

  abstract create(packaging: Packaging & { associationId: string }): Promise<void>;

  abstract deleteOwn(
    associationId: string,
    productId: string,
    packagingId: string,
  ): Promise<boolean>;
}

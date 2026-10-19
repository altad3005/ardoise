import type { Product, ProductForAssociation } from './product.js';

export abstract class ProductRepository {
  abstract findVisible(associationId: string): Promise<ProductForAssociation[]>;

  abstract findVisibleById(
    associationId: string,
    productId: string,
  ): Promise<ProductForAssociation | null>;

  abstract existsVisibleWithName(associationId: string, name: string): Promise<boolean>;

  abstract create(product: Product & { associationId: string }): Promise<void>;

  abstract activate(associationId: string, product: Product): Promise<void>;

  abstract deactivate(associationId: string, productId: string): Promise<void>;
}

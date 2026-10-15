import type { Product, ProductForAssociation } from './product.js';

export abstract class ProductRepository {
  abstract findVisible(associationId: string): Promise<ProductForAssociation[]>;

  abstract findVisibleById(
    associationId: string,
    productId: string,
  ): Promise<ProductForAssociation | null>;

  abstract activate(associationId: string, product: Product): Promise<void>;

  abstract deactivate(associationId: string, productId: string): Promise<void>;
}

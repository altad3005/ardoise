import { Injectable } from '@nestjs/common';
import { ProductNotFoundError } from '../domain/product.js';
import { ProductRepository } from '../domain/product.repository.js';

@Injectable()
export class DeactivateProduct {
  constructor(private readonly products: ProductRepository) {}

  async execute(associationId: string, productId: string): Promise<void> {
    const product = await this.products.findVisibleById(associationId, productId);
    if (!product) {
      throw new ProductNotFoundError();
    }
    await this.products.deactivate(associationId, productId);
  }
}

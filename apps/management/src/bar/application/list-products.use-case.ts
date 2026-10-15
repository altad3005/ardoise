import { Injectable } from '@nestjs/common';
import type { ProductForAssociation } from '../domain/product.js';
import { ProductRepository } from '../domain/product.repository.js';

@Injectable()
export class ListProducts {
  constructor(private readonly products: ProductRepository) {}

  execute(associationId: string): Promise<ProductForAssociation[]> {
    return this.products.findVisible(associationId);
  }
}

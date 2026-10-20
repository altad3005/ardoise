import { Injectable } from '@nestjs/common';
import type { Packaging } from '../domain/packaging.js';
import { PackagingRepository } from '../domain/packaging.repository.js';
import { ProductNotFoundError } from '../domain/product.js';
import { ProductRepository } from '../domain/product.repository.js';

@Injectable()
export class ListPackagings {
  constructor(
    private readonly products: ProductRepository,
    private readonly packagings: PackagingRepository,
  ) {}

  async execute(associationId: string, productId: string): Promise<Packaging[]> {
    if (!(await this.products.findVisibleById(associationId, productId))) {
      throw new ProductNotFoundError();
    }
    return this.packagings.findVisible(associationId, productId);
  }
}

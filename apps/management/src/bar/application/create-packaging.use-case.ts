import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { NewPackaging } from '@ardoise/types';
import { PackagingLabelAlreadyUsedError, type Packaging } from '../domain/packaging.js';
import { PackagingRepository } from '../domain/packaging.repository.js';
import { ProductNotFoundError } from '../domain/product.js';
import { ProductRepository } from '../domain/product.repository.js';

@Injectable()
export class CreatePackaging {
  constructor(
    private readonly products: ProductRepository,
    private readonly packagings: PackagingRepository,
  ) {}

  async execute(
    associationId: string,
    productId: string,
    newPackaging: NewPackaging,
  ): Promise<Packaging> {
    if (!(await this.products.findVisibleById(associationId, productId))) {
      throw new ProductNotFoundError();
    }
    if (
      await this.packagings.existsVisibleWithLabel(associationId, productId, newPackaging.label)
    ) {
      throw new PackagingLabelAlreadyUsedError();
    }
    const packaging = { id: randomUUID(), productId, associationId, ...newPackaging };
    await this.packagings.create(packaging);
    return packaging;
  }
}

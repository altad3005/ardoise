import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { NewProduct } from '@ardoise/types';
import { ProductNameAlreadyUsedError, type Product } from '../domain/product.js';
import { ProductRepository } from '../domain/product.repository.js';

@Injectable()
export class CreateProduct {
  constructor(private readonly products: ProductRepository) {}

  async execute(associationId: string, newProduct: NewProduct): Promise<Product> {
    if (await this.products.existsVisibleWithName(associationId, newProduct.name)) {
      throw new ProductNameAlreadyUsedError();
    }
    const product = { id: randomUUID(), associationId, ...newProduct };
    await this.products.create(product);
    return product;
  }
}

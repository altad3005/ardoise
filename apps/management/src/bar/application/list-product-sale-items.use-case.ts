import { Injectable } from '@nestjs/common';
import { ProductNotFoundError } from '../domain/product.js';
import { ProductRepository } from '../domain/product.repository.js';
import type { SaleItem } from '../domain/sale-item.js';
import { SaleItemRepository } from '../domain/sale-item.repository.js';

@Injectable()
export class ListProductSaleItems {
  constructor(
    private readonly products: ProductRepository,
    private readonly saleItems: SaleItemRepository,
  ) {}

  async execute(associationId: string, productId: string): Promise<SaleItem[]> {
    if (!(await this.products.findVisibleById(associationId, productId))) {
      throw new ProductNotFoundError();
    }
    return this.saleItems.findByProduct(associationId, productId);
  }
}

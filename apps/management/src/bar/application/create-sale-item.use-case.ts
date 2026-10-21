import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { NewSaleItem } from '@ardoise/types';
import { ProductNotFoundError } from '../domain/product.js';
import { ProductRepository } from '../domain/product.repository.js';
import { SaleItemNameAlreadyUsedError, type SaleItem } from '../domain/sale-item.js';
import { SaleItemRepository } from '../domain/sale-item.repository.js';

@Injectable()
export class CreateSaleItem {
  constructor(
    private readonly products: ProductRepository,
    private readonly saleItems: SaleItemRepository,
  ) {}

  async execute(
    associationId: string,
    productId: string,
    newSaleItem: NewSaleItem,
  ): Promise<SaleItem> {
    const product = await this.products.findVisibleById(associationId, productId);
    if (!product?.isActive) {
      throw new ProductNotFoundError();
    }
    if (await this.saleItems.existsWithName(associationId, newSaleItem.name)) {
      throw new SaleItemNameAlreadyUsedError();
    }
    const saleItem = {
      id: randomUUID(),
      associationId,
      productId,
      ...newSaleItem,
      isActive: true,
      menuPosition: null,
    };
    await this.saleItems.create(saleItem);
    return saleItem;
  }
}

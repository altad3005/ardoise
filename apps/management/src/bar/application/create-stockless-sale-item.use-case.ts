import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { NewStocklessSaleItem } from '@ardoise/types';
import { SaleItemNameAlreadyUsedError, type SaleItem } from '../domain/sale-item.js';
import { SaleItemRepository } from '../domain/sale-item.repository.js';

@Injectable()
export class CreateStocklessSaleItem {
  constructor(private readonly saleItems: SaleItemRepository) {}

  async execute(associationId: string, newSaleItem: NewStocklessSaleItem): Promise<SaleItem> {
    if (await this.saleItems.existsWithName(associationId, newSaleItem.name)) {
      throw new SaleItemNameAlreadyUsedError();
    }
    const saleItem = {
      id: randomUUID(),
      associationId,
      productId: null,
      consumedQuantity: null,
      ...newSaleItem,
      isActive: true,
    };
    await this.saleItems.create(saleItem);
    return saleItem;
  }
}

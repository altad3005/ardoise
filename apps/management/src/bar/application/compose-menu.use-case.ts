import { Injectable } from '@nestjs/common';
import {
  SaleItemInactiveError,
  SaleItemNotFoundError,
  type SaleItem,
} from '../domain/sale-item.js';
import { SaleItemRepository } from '../domain/sale-item.repository.js';

@Injectable()
export class ComposeMenu {
  constructor(private readonly saleItems: SaleItemRepository) {}

  async execute(associationId: string, saleItemIds: readonly string[]): Promise<SaleItem[]> {
    for (const saleItemId of saleItemIds) {
      const saleItem = await this.saleItems.findById(associationId, saleItemId);
      if (!saleItem) {
        throw new SaleItemNotFoundError();
      }
      if (!saleItem.isActive) {
        throw new SaleItemInactiveError();
      }
    }
    await this.saleItems.replaceMenu(associationId, saleItemIds);
    return this.saleItems.findOnMenu(associationId);
  }
}

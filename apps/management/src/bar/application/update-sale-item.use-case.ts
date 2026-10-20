import { Injectable } from '@nestjs/common';
import type { SaleItemChanges } from '@ardoise/types';
import {
  SaleItemConsumptionMismatchError,
  SaleItemNameAlreadyUsedError,
  SaleItemNotFoundError,
  type SaleItem,
} from '../domain/sale-item.js';
import { SaleItemRepository } from '../domain/sale-item.repository.js';

@Injectable()
export class UpdateSaleItem {
  constructor(private readonly saleItems: SaleItemRepository) {}

  async execute(
    associationId: string,
    saleItemId: string,
    changes: SaleItemChanges,
  ): Promise<SaleItem> {
    const saleItem = await this.saleItems.findById(associationId, saleItemId);
    if (!saleItem) {
      throw new SaleItemNotFoundError();
    }
    const consumedQuantity = changes.consumedQuantity ?? null;
    if ((saleItem.productId === null) !== (consumedQuantity === null)) {
      throw new SaleItemConsumptionMismatchError();
    }
    if (await this.saleItems.existsWithName(associationId, changes.name, saleItemId)) {
      throw new SaleItemNameAlreadyUsedError();
    }
    const updated = { ...saleItem, ...changes, consumedQuantity };
    await this.saleItems.update(updated);
    return updated;
  }
}

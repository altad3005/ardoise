import { Injectable } from '@nestjs/common';
import type { SaleItem } from '../domain/sale-item.js';
import { SaleItemRepository } from '../domain/sale-item.repository.js';

@Injectable()
export class ListStocklessSaleItems {
  constructor(private readonly saleItems: SaleItemRepository) {}

  execute(associationId: string): Promise<SaleItem[]> {
    return this.saleItems.findStockless(associationId);
  }
}

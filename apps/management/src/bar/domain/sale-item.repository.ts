import type { SaleItem } from './sale-item.js';

export abstract class SaleItemRepository {
  abstract findByProduct(associationId: string, productId: string): Promise<SaleItem[]>;

  abstract findStockless(associationId: string): Promise<SaleItem[]>;

  abstract findOnMenu(associationId: string): Promise<SaleItem[]>;

  abstract findById(associationId: string, saleItemId: string): Promise<SaleItem | null>;

  abstract existsWithName(
    associationId: string,
    name: string,
    exceptSaleItemId?: string,
  ): Promise<boolean>;

  abstract create(saleItem: SaleItem): Promise<void>;

  abstract update(saleItem: SaleItem): Promise<void>;

  abstract replaceMenu(associationId: string, saleItemIds: readonly string[]): Promise<void>;
}

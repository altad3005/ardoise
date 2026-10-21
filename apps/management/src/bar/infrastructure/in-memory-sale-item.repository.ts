import type { SaleItem } from '../domain/sale-item.js';
import { SaleItemRepository } from '../domain/sale-item.repository.js';

export class InMemorySaleItemRepository extends SaleItemRepository {
  private readonly saleItems: SaleItem[];

  constructor(saleItems: readonly SaleItem[]) {
    super();
    this.saleItems = saleItems.map((saleItem) => ({ ...saleItem }));
  }

  async findAll(associationId: string): Promise<SaleItem[]> {
    return this.saleItems
      .filter((saleItem) => saleItem.associationId === associationId)
      .toSorted((first, second) => first.name.localeCompare(second.name))
      .map((saleItem) => ({ ...saleItem }));
  }

  async findByProduct(associationId: string, productId: string): Promise<SaleItem[]> {
    return this.saleItems
      .filter(
        (saleItem) => saleItem.associationId === associationId && saleItem.productId === productId,
      )
      .toSorted(byConsumptionThenName)
      .map((saleItem) => ({ ...saleItem }));
  }

  async findStockless(associationId: string): Promise<SaleItem[]> {
    return this.saleItems
      .filter((saleItem) => saleItem.associationId === associationId && saleItem.productId === null)
      .toSorted(byConsumptionThenName)
      .map((saleItem) => ({ ...saleItem }));
  }

  async findOnMenu(associationId: string): Promise<SaleItem[]> {
    return this.saleItems
      .filter(
        (saleItem) => saleItem.associationId === associationId && saleItem.menuPosition !== null,
      )
      .toSorted((first, second) => (first.menuPosition ?? 0) - (second.menuPosition ?? 0))
      .map((saleItem) => ({ ...saleItem }));
  }

  async findById(associationId: string, saleItemId: string): Promise<SaleItem | null> {
    const saleItem = this.saleItems.find(
      (candidate) => candidate.id === saleItemId && candidate.associationId === associationId,
    );
    return saleItem ? { ...saleItem } : null;
  }

  async existsWithName(
    associationId: string,
    name: string,
    exceptSaleItemId?: string,
  ): Promise<boolean> {
    return this.saleItems.some(
      (saleItem) =>
        saleItem.associationId === associationId &&
        saleItem.id !== exceptSaleItemId &&
        saleItem.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
  }

  async create(saleItem: SaleItem): Promise<void> {
    this.saleItems.push({ ...saleItem });
  }

  async update(saleItem: SaleItem): Promise<void> {
    const index = this.saleItems.findIndex((candidate) => candidate.id === saleItem.id);
    this.saleItems[index] = { ...saleItem };
  }

  async replaceMenu(associationId: string, saleItemIds: readonly string[]): Promise<void> {
    for (const saleItem of this.saleItems) {
      if (saleItem.associationId === associationId) {
        const position = saleItemIds.indexOf(saleItem.id);
        saleItem.menuPosition = position === -1 ? null : position;
      }
    }
  }
}

function byConsumptionThenName(first: SaleItem, second: SaleItem): number {
  return (
    (first.consumedQuantity ?? 0) - (second.consumedQuantity ?? 0) ||
    first.name.localeCompare(second.name)
  );
}

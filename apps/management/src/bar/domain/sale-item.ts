export interface SaleItem {
  id: string;
  associationId: string;
  productId: string | null;
  name: string;
  consumedQuantity: number | null;
  basePriceCents: number | null;
  isActive: boolean;
  menuPosition: number | null;
}

export class SaleItemNameAlreadyUsedError extends Error {
  constructor() {
    super('Sale item name already used');
  }
}

export class SaleItemNotFoundError extends Error {
  constructor() {
    super('Sale item not found');
  }
}

export class SaleItemInactiveError extends Error {
  constructor() {
    super('An inactive sale item cannot be put on the menu');
  }
}

export class SaleItemConsumptionMismatchError extends Error {
  constructor() {
    super('Only an item with stock has a consumed quantity');
  }
}

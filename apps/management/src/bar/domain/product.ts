import type { ProductCategory } from '@ardoise/types';

export interface Product {
  id: string;
  associationId: string | null;
  name: string;
  category: ProductCategory;
  stockUnit: string;
}

export interface ProductForAssociation extends Product {
  isActive: boolean;
}

export class ProductNameAlreadyUsedError extends Error {
  constructor() {
    super('Product name already used');
  }
}

export class ProductNotFoundError extends Error {
  constructor() {
    super('Product not found');
  }
}

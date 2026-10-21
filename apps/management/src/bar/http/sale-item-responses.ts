import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { CatalogueSaleItem } from '@ardoise/types';
import { ProductNotFoundError } from '../domain/product.js';
import {
  SaleItemConsumptionMismatchError,
  SaleItemInactiveError,
  SaleItemNameAlreadyUsedError,
  SaleItemNotFoundError,
  type SaleItem,
} from '../domain/sale-item.js';

export function toCatalogueSaleItem(saleItem: SaleItem): CatalogueSaleItem {
  return {
    id: saleItem.id,
    productId: saleItem.productId,
    name: saleItem.name,
    consumedQuantity: saleItem.consumedQuantity,
    basePriceCents: saleItem.basePriceCents,
    isActive: saleItem.isActive,
    menuPosition: saleItem.menuPosition,
  };
}

export async function rethrowAsHttp<T>(operation: Promise<T>): Promise<T> {
  try {
    return await operation;
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      throw new NotFoundException('Product not found');
    }
    if (error instanceof SaleItemNotFoundError) {
      throw new NotFoundException('Sale item not found');
    }
    if (error instanceof SaleItemNameAlreadyUsedError) {
      throw new ConflictException('A sale item already uses this name');
    }
    if (error instanceof SaleItemInactiveError) {
      throw new ConflictException('An inactive sale item cannot be put on the menu');
    }
    if (error instanceof SaleItemConsumptionMismatchError) {
      throw new BadRequestException('Only an item with stock has a consumed quantity');
    }
    throw error;
  }
}

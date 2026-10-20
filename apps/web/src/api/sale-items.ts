import {
  saleItemListSchema,
  saleItemSchema,
  type CatalogueSaleItem,
  type NewSaleItem,
  type NewStocklessSaleItem,
  type SaleItemChanges,
} from '@ardoise/types';
import { ApiError } from './api-error.ts';

const productSaleItemsUrl = (productId: string) =>
  `/api/management/products/${productId}/sale-items`;
const stocklessSaleItemsUrl = '/api/management/stockless-sale-items';

export function fetchProductSaleItems(productId: string): Promise<CatalogueSaleItem[]> {
  return fetchList(productSaleItemsUrl(productId));
}

export function createSaleItem(
  productId: string,
  newSaleItem: NewSaleItem,
): Promise<CatalogueSaleItem> {
  return send('POST', productSaleItemsUrl(productId), newSaleItem);
}

export function fetchStocklessSaleItems(): Promise<CatalogueSaleItem[]> {
  return fetchList(stocklessSaleItemsUrl);
}

export function createStocklessSaleItem(
  newSaleItem: NewStocklessSaleItem,
): Promise<CatalogueSaleItem> {
  return send('POST', stocklessSaleItemsUrl, newSaleItem);
}

export function updateSaleItem(
  saleItemId: string,
  changes: SaleItemChanges,
): Promise<CatalogueSaleItem> {
  return send('PUT', `/api/management/sale-items/${saleItemId}`, changes);
}

async function fetchList(url: string): Promise<CatalogueSaleItem[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  return saleItemListSchema.parse(await response.json());
}

async function send(method: 'POST' | 'PUT', url: string, body: object): Promise<CatalogueSaleItem> {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  return saleItemSchema.parse(await response.json());
}

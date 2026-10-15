import { productListSchema, type CatalogueProduct } from '@ardoise/types';
import { ApiError } from './api-error.ts';

const productsUrl = '/api/management/products';

export async function fetchProducts(): Promise<CatalogueProduct[]> {
  const response = await fetch(productsUrl);
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  return productListSchema.parse(await response.json());
}

export function activateProduct(productId: string): Promise<void> {
  return changeActivation(productId, 'PUT');
}

export function deactivateProduct(productId: string): Promise<void> {
  return changeActivation(productId, 'DELETE');
}

async function changeActivation(productId: string, method: 'PUT' | 'DELETE'): Promise<void> {
  const response = await fetch(`${productsUrl}/${productId}/activation`, { method });
  if (!response.ok) {
    throw new ApiError(response.status);
  }
}

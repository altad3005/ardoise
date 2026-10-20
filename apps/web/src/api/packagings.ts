import {
  packagingListSchema,
  packagingSchema,
  type NewPackaging,
  type PurchasePackaging,
} from '@ardoise/types';
import { ApiError } from './api-error.ts';

const packagingsUrl = (productId: string) => `/api/management/products/${productId}/packagings`;

export async function fetchPackagings(productId: string): Promise<PurchasePackaging[]> {
  const response = await fetch(packagingsUrl(productId));
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  return packagingListSchema.parse(await response.json());
}

export async function createPackaging(
  productId: string,
  newPackaging: NewPackaging,
): Promise<PurchasePackaging> {
  const response = await fetch(packagingsUrl(productId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newPackaging),
  });
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  return packagingSchema.parse(await response.json());
}

export async function deletePackaging(productId: string, packagingId: string): Promise<void> {
  const response = await fetch(`${packagingsUrl(productId)}/${packagingId}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new ApiError(response.status);
  }
}

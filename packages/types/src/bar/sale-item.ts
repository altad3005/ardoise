import { z } from 'zod';
import { idSchema } from '../common/identifier.js';
import { amountInCentsSchema } from '../common/money.js';
import { stockQuantitySchema } from './stock-quantity.js';

const nameSchema = z.string().trim().min(1).max(60);
const basePriceCentsSchema = amountInCentsSchema.min(0).max(100000);

export const newSaleItemSchema = z.object({
  name: nameSchema,
  consumedQuantity: stockQuantitySchema,
  basePriceCents: basePriceCentsSchema,
});

export type NewSaleItem = z.infer<typeof newSaleItemSchema>;

export const newStocklessSaleItemSchema = newSaleItemSchema.omit({ consumedQuantity: true });

export type NewStocklessSaleItem = z.infer<typeof newStocklessSaleItemSchema>;

export const saleItemChangesSchema = newSaleItemSchema.partial({ consumedQuantity: true });

export type SaleItemChanges = z.infer<typeof saleItemChangesSchema>;

export const saleItemSchema = z.object({
  id: idSchema,
  productId: idSchema.nullable(),
  name: z.string(),
  consumedQuantity: z.number().nullable(),
  basePriceCents: z.int().nullable(),
  isActive: z.boolean(),
  menuPosition: z.int().nullable(),
});

export type CatalogueSaleItem = z.infer<typeof saleItemSchema>;

export const saleItemListSchema = z.array(saleItemSchema);

import { z } from 'zod';
import { idSchema } from '../common/identifier.js';
import { stockQuantitySchema } from './stock-quantity.js';

export const newPackagingSchema = z.object({
  label: z.string().trim().min(1).max(40),
  unitCount: stockQuantitySchema,
});

export type NewPackaging = z.infer<typeof newPackagingSchema>;

export const packagingSchema = z.object({
  id: idSchema,
  label: z.string(),
  unitCount: z.number(),
  isShared: z.boolean(),
});

export type PurchasePackaging = z.infer<typeof packagingSchema>;

export const packagingListSchema = z.array(packagingSchema);

import { z } from 'zod';
import { idSchema } from '../common/identifier.js';

export const newPackagingSchema = z.object({
  label: z.string().trim().min(1).max(40),
  unitCount: z.number().positive().max(10000).multipleOf(0.0001),
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

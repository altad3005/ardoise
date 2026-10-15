import { z } from 'zod';
import { idSchema } from '../common/identifier.js';

export const productCategorySchema = z.enum(['BEER', 'SOFT_DRINK', 'SPIRIT', 'WINE']);

export type ProductCategory = z.infer<typeof productCategorySchema>;

export const productSchema = z.object({
  id: idSchema,
  name: z.string(),
  category: productCategorySchema,
  stockUnit: z.string(),
  isShared: z.boolean(),
  isActive: z.boolean(),
});

export type CatalogueProduct = z.infer<typeof productSchema>;

export const productListSchema = z.array(productSchema);

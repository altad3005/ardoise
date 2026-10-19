import { z } from 'zod';
import { idSchema } from '../common/identifier.js';

export const productCategorySchema = z.enum([
  'PILSNER',
  'SPECIALTY_BEER',
  'SOFT_DRINK',
  'SPIRIT',
  'WINE',
]);

export type ProductCategory = z.infer<typeof productCategorySchema>;

export const newProductSchema = z.object({
  name: z.string().trim().min(1).max(80),
  category: productCategorySchema,
  stockUnit: z.string().trim().min(1).max(30),
});

export type NewProduct = z.infer<typeof newProductSchema>;

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

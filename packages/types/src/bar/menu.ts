import { z } from 'zod';
import { idSchema } from '../common/identifier.js';

export const menuCompositionSchema = z.object({
  saleItemIds: z
    .array(idSchema)
    .refine((ids) => new Set(ids).size === ids.length, 'A sale item appears only once on the menu'),
});

export type MenuComposition = z.infer<typeof menuCompositionSchema>;

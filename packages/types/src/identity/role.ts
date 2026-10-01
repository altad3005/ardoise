import { z } from 'zod';

export const roleSchema = z.enum([
  'ADMINISTRATOR',
  'STOCK_MANAGER',
  'TREASURER',
  'BARTENDER',
  'VIEWER',
]);

export type Role = z.infer<typeof roleSchema>;

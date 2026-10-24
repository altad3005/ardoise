import { z } from 'zod';
import { idSchema } from '../common/identifier.js';
import { amountInCentsSchema } from '../common/money.js';

export const accountTypeSchema = z.enum(['BANK', 'CASH']);

export type AccountType = z.infer<typeof accountTypeSchema>;

const nameSchema = z.string().trim().min(1).max(60);

export const openingBalanceCentsSchema = amountInCentsSchema.min(-10_000_000).max(10_000_000);

export const newAccountSchema = z
  .object({
    name: nameSchema,
    type: accountTypeSchema,
    openingBalanceCents: openingBalanceCentsSchema,
  })
  .refine((account) => account.type !== 'CASH' || account.openingBalanceCents >= 0, {
    message: 'A cash account cannot start with a negative balance',
    path: ['openingBalanceCents'],
  });

export type NewAccount = z.infer<typeof newAccountSchema>;

export const accountChangesSchema = z
  .object({ name: nameSchema, openingBalanceCents: openingBalanceCentsSchema })
  .partial();

export type AccountChanges = z.infer<typeof accountChangesSchema>;

export const accountSchema = z.object({
  id: idSchema,
  name: z.string(),
  type: accountTypeSchema,
  openingBalanceCents: z.int(),
  balanceCents: z.int(),
});

export type TreasuryAccount = z.infer<typeof accountSchema>;

export const accountListSchema = z.array(accountSchema);

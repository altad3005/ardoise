import { z } from 'zod';

export const amountInCentsSchema = z.int();

export type AmountInCents = z.infer<typeof amountInCentsSchema>;

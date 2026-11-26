import { z } from 'zod';
import { idSchema } from '../common/identifier.js';

export const treasurySettingsSchema = z.object({
  defaultProjectId: idSchema.nullable(),
  stockProjectId: idSchema.nullable(),
  defaultCashAccountId: idSchema.nullable(),
});

export type TreasurySettings = z.infer<typeof treasurySettingsSchema>;

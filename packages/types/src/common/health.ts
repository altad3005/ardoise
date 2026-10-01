import { z } from 'zod';

export const healthStatusSchema = z.object({
  status: z.string(),
});

export type HealthStatus = z.infer<typeof healthStatusSchema>;

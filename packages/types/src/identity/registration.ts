import { z } from 'zod';
import { idSchema } from '../common/identifier.js';

export const registrationSchema = z.object({
  email: z.string().trim().pipe(z.email()),
  displayName: z.string().trim().min(1).max(50),
  password: z.string().min(12).max(128),
});

export type Registration = z.infer<typeof registrationSchema>;

export const registeredUserSchema = z.object({
  id: idSchema,
  email: z.string(),
  displayName: z.string(),
});

export type RegisteredUser = z.infer<typeof registeredUserSchema>;

import { z } from 'zod';

export const stockQuantitySchema = z.number().positive().max(10000).multipleOf(0.0001);

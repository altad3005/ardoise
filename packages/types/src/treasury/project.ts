import { z } from 'zod';
import { idSchema } from '../common/identifier.js';

const nameSchema = z.string().trim().min(1).max(60);

export const newProjectCategorySchema = z.object({ name: nameSchema });

export type NewProjectCategory = z.infer<typeof newProjectCategorySchema>;

export const projectCategoryChangesSchema = newProjectCategorySchema;

export type ProjectCategoryChanges = z.infer<typeof projectCategoryChangesSchema>;

export const projectCategorySchema = z.object({
  id: idSchema,
  name: z.string(),
});

export type ProjectCategory = z.infer<typeof projectCategorySchema>;

export const projectCategoryListSchema = z.array(projectCategorySchema);

export const newProjectSchema = z.object({ name: nameSchema, categoryId: idSchema });

export type NewProject = z.infer<typeof newProjectSchema>;

export const projectChangesSchema = newProjectSchema.partial();

export type ProjectChanges = z.infer<typeof projectChangesSchema>;

export const projectSchema = z.object({
  id: idSchema,
  name: z.string(),
  categoryId: idSchema,
});

export type TreasuryProject = z.infer<typeof projectSchema>;

export const projectListSchema = z.array(projectSchema);

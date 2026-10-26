import type { ProjectCategory } from './project-category.js';

export abstract class ProjectCategoryRepository {
  abstract findAll(associationId: string): Promise<ProjectCategory[]>;

  abstract findById(associationId: string, categoryId: string): Promise<ProjectCategory | null>;

  abstract existsWithName(
    associationId: string,
    name: string,
    exceptCategoryId?: string,
  ): Promise<boolean>;

  abstract create(category: ProjectCategory): Promise<void>;

  abstract update(category: ProjectCategory): Promise<void>;
}

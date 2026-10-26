import { Injectable } from '@nestjs/common';
import type { ProjectCategory } from '../domain/project-category.js';
import { ProjectCategoryRepository } from '../domain/project-category.repository.js';

@Injectable()
export class ListProjectCategories {
  constructor(private readonly categories: ProjectCategoryRepository) {}

  execute(associationId: string): Promise<ProjectCategory[]> {
    return this.categories.findAll(associationId);
  }
}

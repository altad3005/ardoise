import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { NewProjectCategory } from '@ardoise/types';
import {
  ProjectCategoryNameAlreadyUsedError,
  type ProjectCategory,
} from '../domain/project-category.js';
import { ProjectCategoryRepository } from '../domain/project-category.repository.js';

@Injectable()
export class CreateProjectCategory {
  constructor(private readonly categories: ProjectCategoryRepository) {}

  async execute(associationId: string, newCategory: NewProjectCategory): Promise<ProjectCategory> {
    if (await this.categories.existsWithName(associationId, newCategory.name)) {
      throw new ProjectCategoryNameAlreadyUsedError();
    }
    const category = { id: randomUUID(), associationId, ...newCategory };
    await this.categories.create(category);
    return category;
  }
}

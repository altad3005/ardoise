import { Injectable } from '@nestjs/common';
import type { ProjectCategoryChanges } from '@ardoise/types';
import {
  ProjectCategoryNameAlreadyUsedError,
  ProjectCategoryNotFoundError,
  type ProjectCategory,
} from '../domain/project-category.js';
import { ProjectCategoryRepository } from '../domain/project-category.repository.js';

@Injectable()
export class RenameProjectCategory {
  constructor(private readonly categories: ProjectCategoryRepository) {}

  async execute(
    associationId: string,
    categoryId: string,
    changes: ProjectCategoryChanges,
  ): Promise<ProjectCategory> {
    const category = await this.categories.findById(associationId, categoryId);
    if (!category) {
      throw new ProjectCategoryNotFoundError();
    }
    if (await this.categories.existsWithName(associationId, changes.name, categoryId)) {
      throw new ProjectCategoryNameAlreadyUsedError();
    }
    const renamed = { ...category, name: changes.name };
    await this.categories.update(renamed);
    return renamed;
  }
}

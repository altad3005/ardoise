import { Injectable } from '@nestjs/common';
import type { ProjectChanges } from '@ardoise/types';
import { ProjectCategoryNotFoundError } from '../domain/project-category.js';
import { ProjectCategoryRepository } from '../domain/project-category.repository.js';
import {
  ProjectNameAlreadyUsedError,
  ProjectNotFoundError,
  type Project,
} from '../domain/project.js';
import { ProjectRepository } from '../domain/project.repository.js';

@Injectable()
export class UpdateProject {
  constructor(
    private readonly categories: ProjectCategoryRepository,
    private readonly projects: ProjectRepository,
  ) {}

  async execute(
    associationId: string,
    projectId: string,
    changes: ProjectChanges,
  ): Promise<Project> {
    const project = await this.projects.findById(associationId, projectId);
    if (!project) {
      throw new ProjectNotFoundError();
    }
    if (
      changes.categoryId &&
      !(await this.categories.findById(associationId, changes.categoryId))
    ) {
      throw new ProjectCategoryNotFoundError();
    }
    const updated = { ...project, ...changes };
    if (await this.projects.existsWithName(associationId, updated.name, projectId)) {
      throw new ProjectNameAlreadyUsedError();
    }
    await this.projects.update(updated);
    return updated;
  }
}

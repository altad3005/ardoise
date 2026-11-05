import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { NewProject } from '@ardoise/types';
import { ProjectCategoryNotFoundError } from '../domain/project-category.js';
import { ProjectCategoryRepository } from '../domain/project-category.repository.js';
import { ProjectNameAlreadyUsedError, type Project } from '../domain/project.js';
import { ProjectRepository } from '../domain/project.repository.js';

@Injectable()
export class CreateProject {
  constructor(
    private readonly categories: ProjectCategoryRepository,
    private readonly projects: ProjectRepository,
  ) {}

  async execute(associationId: string, newProject: NewProject): Promise<Project> {
    if (!(await this.categories.findById(associationId, newProject.categoryId))) {
      throw new ProjectCategoryNotFoundError();
    }
    if (await this.projects.existsWithName(associationId, newProject.name)) {
      throw new ProjectNameAlreadyUsedError();
    }
    const project = { id: randomUUID(), associationId, ...newProject, isActive: true };
    await this.projects.create(project);
    return project;
  }
}

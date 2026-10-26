import { Injectable } from '@nestjs/common';
import type { Project } from '../domain/project.js';
import { ProjectRepository } from '../domain/project.repository.js';

@Injectable()
export class ListProjects {
  constructor(private readonly projects: ProjectRepository) {}

  execute(associationId: string): Promise<Project[]> {
    return this.projects.findAll(associationId);
  }
}

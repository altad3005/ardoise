import type { Project } from './project.js';

export abstract class ProjectRepository {
  abstract findAll(associationId: string): Promise<Project[]>;

  abstract findById(associationId: string, projectId: string): Promise<Project | null>;

  abstract existsWithName(
    associationId: string,
    name: string,
    exceptProjectId?: string,
  ): Promise<boolean>;

  abstract create(project: Project): Promise<void>;

  abstract update(project: Project): Promise<void>;
}

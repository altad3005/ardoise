import type { Project } from '../domain/project.js';
import { ProjectRepository } from '../domain/project.repository.js';

export class InMemoryProjectRepository extends ProjectRepository {
  private readonly projects: Project[];

  constructor(projects: readonly Project[]) {
    super();
    this.projects = [...projects];
  }

  async findAll(associationId: string): Promise<Project[]> {
    return this.projects
      .filter((project) => project.associationId === associationId)
      .toSorted((first, second) => first.name.localeCompare(second.name));
  }

  async findById(associationId: string, projectId: string): Promise<Project | null> {
    return (
      this.projects.find(
        (project) => project.id === projectId && project.associationId === associationId,
      ) ?? null
    );
  }

  async existsWithName(
    associationId: string,
    name: string,
    exceptProjectId?: string,
  ): Promise<boolean> {
    return this.projects.some(
      (project) =>
        project.associationId === associationId &&
        project.id !== exceptProjectId &&
        project.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
  }

  async create(project: Project): Promise<void> {
    this.projects.push(project);
  }

  async update(project: Project): Promise<void> {
    const index = this.projects.findIndex((candidate) => candidate.id === project.id);
    this.projects[index] = project;
  }
}

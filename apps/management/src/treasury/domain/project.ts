export interface Project {
  id: string;
  associationId: string;
  categoryId: string;
  name: string;
  isActive: boolean;
}

export class ProjectNameAlreadyUsedError extends Error {
  constructor() {
    super('Project name already used');
  }
}

export class ProjectNotFoundError extends Error {
  constructor() {
    super('Project not found');
  }
}

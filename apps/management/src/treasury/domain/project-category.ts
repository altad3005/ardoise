export interface ProjectCategory {
  id: string;
  associationId: string;
  name: string;
}

export class ProjectCategoryNameAlreadyUsedError extends Error {
  constructor() {
    super('Project category name already used');
  }
}

export class ProjectCategoryNotFoundError extends Error {
  constructor() {
    super('Project category not found');
  }
}

import type { ProjectCategory } from '../domain/project-category.js';
import { ProjectCategoryRepository } from '../domain/project-category.repository.js';

export class InMemoryProjectCategoryRepository extends ProjectCategoryRepository {
  private readonly categories: ProjectCategory[];

  constructor(categories: readonly ProjectCategory[]) {
    super();
    this.categories = [...categories];
  }

  async findAll(associationId: string): Promise<ProjectCategory[]> {
    return this.categories
      .filter((category) => category.associationId === associationId)
      .toSorted((first, second) => first.name.localeCompare(second.name));
  }

  async findById(associationId: string, categoryId: string): Promise<ProjectCategory | null> {
    return (
      this.categories.find(
        (category) => category.id === categoryId && category.associationId === associationId,
      ) ?? null
    );
  }

  async existsWithName(
    associationId: string,
    name: string,
    exceptCategoryId?: string,
  ): Promise<boolean> {
    return this.categories.some(
      (category) =>
        category.associationId === associationId &&
        category.id !== exceptCategoryId &&
        category.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
  }

  async create(category: ProjectCategory): Promise<void> {
    this.categories.push(category);
  }

  async update(category: ProjectCategory): Promise<void> {
    const index = this.categories.findIndex((candidate) => candidate.id === category.id);
    this.categories[index] = category;
  }
}

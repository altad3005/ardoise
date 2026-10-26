import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import {
  ProjectCategoryNameAlreadyUsedError,
  type ProjectCategory,
} from '../domain/project-category.js';
import { ProjectCategoryRepository } from '../domain/project-category.repository.js';
import { rethrowUniqueViolation } from './unique-violation.js';

@Injectable()
export class PrismaProjectCategoryRepository extends ProjectCategoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  findAll(associationId: string): Promise<ProjectCategory[]> {
    return this.prisma.projectCategory.findMany({
      where: { associationId },
      orderBy: { name: 'asc' },
    });
  }

  findById(associationId: string, categoryId: string): Promise<ProjectCategory | null> {
    return this.prisma.projectCategory.findFirst({ where: { id: categoryId, associationId } });
  }

  async existsWithName(
    associationId: string,
    name: string,
    exceptCategoryId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.projectCategory.count({
      where: {
        associationId,
        name: { equals: name, mode: 'insensitive' },
        id: { not: exceptCategoryId },
      },
    });
    return count > 0;
  }

  create(category: ProjectCategory): Promise<void> {
    return rethrowNameConflict(this.prisma.projectCategory.create({ data: category }));
  }

  update({ id, associationId, name }: ProjectCategory): Promise<void> {
    return rethrowNameConflict(
      this.prisma.projectCategory.update({ where: { id, associationId }, data: { name } }),
    );
  }
}

function rethrowNameConflict(operation: Promise<unknown>): Promise<void> {
  return rethrowUniqueViolation(operation, () => new ProjectCategoryNameAlreadyUsedError());
}

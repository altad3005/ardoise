import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { ProjectNameAlreadyUsedError, type Project } from '../domain/project.js';
import { ProjectRepository } from '../domain/project.repository.js';
import { rethrowUniqueViolation } from './unique-violation.js';

@Injectable()
export class PrismaProjectRepository extends ProjectRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  findAll(associationId: string): Promise<Project[]> {
    return this.prisma.project.findMany({ where: { associationId }, orderBy: { name: 'asc' } });
  }

  findById(associationId: string, projectId: string): Promise<Project | null> {
    return this.prisma.project.findFirst({ where: { id: projectId, associationId } });
  }

  async existsWithName(
    associationId: string,
    name: string,
    exceptProjectId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.project.count({
      where: {
        associationId,
        name: { equals: name, mode: 'insensitive' },
        id: { not: exceptProjectId },
      },
    });
    return count > 0;
  }

  create(project: Project): Promise<void> {
    return rethrowNameConflict(this.prisma.project.create({ data: project }));
  }

  update({ id, associationId, ...project }: Project): Promise<void> {
    return rethrowNameConflict(
      this.prisma.project.update({ where: { id, associationId }, data: project }),
    );
  }
}

function rethrowNameConflict(operation: Promise<unknown>): Promise<void> {
  return rethrowUniqueViolation(operation, () => new ProjectNameAlreadyUsedError());
}

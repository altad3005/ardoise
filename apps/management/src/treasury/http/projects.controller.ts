import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  newProjectSchema,
  projectChangesSchema,
  type NewProject,
  type ProjectChanges,
  type TreasuryProject,
} from '@ardoise/types';
import type { AssociationContext } from '../../association-context/association-context.js';
import { CurrentContext, RequireRoles } from '../../association-context/decorators.js';
import { CreateProject } from '../application/create-project.use-case.js';
import { ListProjects } from '../application/list-projects.use-case.js';
import { UpdateProject } from '../application/update-project.use-case.js';
import { ProjectCategoryNotFoundError } from '../domain/project-category.js';
import {
  ProjectNameAlreadyUsedError,
  ProjectNotFoundError,
  type Project,
} from '../domain/project.js';

const idPipe = new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND });

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly listProjects: ListProjects,
    private readonly createProject: CreateProject,
    private readonly updateProject: UpdateProject,
  ) {}

  @Get()
  @RequireRoles('TREASURER', 'VIEWER')
  async list(@CurrentContext() context: AssociationContext): Promise<TreasuryProject[]> {
    const projects = await this.listProjects.execute(context.associationId);
    return projects.map(toTreasuryProject);
  }

  @Post()
  @RequireRoles('TREASURER')
  async create(
    @CurrentContext() context: AssociationContext,
    @Body({ schema: newProjectSchema }) newProject: NewProject,
  ): Promise<TreasuryProject> {
    const project = await rethrowAsHttp(
      this.createProject.execute(context.associationId, newProject),
    );
    return toTreasuryProject(project);
  }

  @Patch(':projectId')
  @RequireRoles('TREASURER')
  async update(
    @CurrentContext() context: AssociationContext,
    @Param('projectId', idPipe) projectId: string,
    @Body({ schema: projectChangesSchema }) changes: ProjectChanges,
  ): Promise<TreasuryProject> {
    const project = await rethrowAsHttp(
      this.updateProject.execute(context.associationId, projectId, changes),
    );
    return toTreasuryProject(project);
  }
}

function toTreasuryProject({ id, name, categoryId }: Project): TreasuryProject {
  return { id, name, categoryId };
}

async function rethrowAsHttp<T>(operation: Promise<T>): Promise<T> {
  try {
    return await operation;
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      throw new NotFoundException('Project not found');
    }
    if (error instanceof ProjectCategoryNotFoundError) {
      throw new NotFoundException('Project category not found');
    }
    if (error instanceof ProjectNameAlreadyUsedError) {
      throw new ConflictException('A project already uses this name');
    }
    throw error;
  }
}

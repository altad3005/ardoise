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
  newProjectCategorySchema,
  projectCategoryChangesSchema,
  type NewProjectCategory,
  type ProjectCategoryChanges,
  type ProjectCategory as ProjectCategoryResponse,
} from '@ardoise/types';
import type { AssociationContext } from '../../association-context/association-context.js';
import { CurrentContext, RequireRoles } from '../../association-context/decorators.js';
import { CreateProjectCategory } from '../application/create-project-category.use-case.js';
import { ListProjectCategories } from '../application/list-project-categories.use-case.js';
import { RenameProjectCategory } from '../application/rename-project-category.use-case.js';
import {
  ProjectCategoryNameAlreadyUsedError,
  ProjectCategoryNotFoundError,
  type ProjectCategory,
} from '../domain/project-category.js';

const idPipe = new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND });

@Controller('project-categories')
export class ProjectCategoriesController {
  constructor(
    private readonly listCategories: ListProjectCategories,
    private readonly createCategory: CreateProjectCategory,
    private readonly renameCategory: RenameProjectCategory,
  ) {}

  @Get()
  @RequireRoles('TREASURER', 'VIEWER')
  async list(@CurrentContext() context: AssociationContext): Promise<ProjectCategoryResponse[]> {
    const categories = await this.listCategories.execute(context.associationId);
    return categories.map(toResponse);
  }

  @Post()
  @RequireRoles('TREASURER')
  async create(
    @CurrentContext() context: AssociationContext,
    @Body({ schema: newProjectCategorySchema }) newCategory: NewProjectCategory,
  ): Promise<ProjectCategoryResponse> {
    const category = await rethrowAsHttp(
      this.createCategory.execute(context.associationId, newCategory),
    );
    return toResponse(category);
  }

  @Patch(':categoryId')
  @RequireRoles('TREASURER')
  async rename(
    @CurrentContext() context: AssociationContext,
    @Param('categoryId', idPipe) categoryId: string,
    @Body({ schema: projectCategoryChangesSchema }) changes: ProjectCategoryChanges,
  ): Promise<ProjectCategoryResponse> {
    const category = await rethrowAsHttp(
      this.renameCategory.execute(context.associationId, categoryId, changes),
    );
    return toResponse(category);
  }
}

function toResponse({ id, name }: ProjectCategory): ProjectCategoryResponse {
  return { id, name };
}

async function rethrowAsHttp<T>(operation: Promise<T>): Promise<T> {
  try {
    return await operation;
  } catch (error) {
    if (error instanceof ProjectCategoryNotFoundError) {
      throw new NotFoundException('Project category not found');
    }
    if (error instanceof ProjectCategoryNameAlreadyUsedError) {
      throw new ConflictException('A project category already uses this name');
    }
    throw error;
  }
}

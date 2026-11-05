import { Module } from '@nestjs/common';
import { DirectoryModule } from '../directory/directory.module.js';
import { CreateAccount } from './application/create-account.use-case.js';
import { CreateProjectCategory } from './application/create-project-category.use-case.js';
import { CreateProject } from './application/create-project.use-case.js';
import { ListAccounts } from './application/list-accounts.use-case.js';
import { ListProjectCategories } from './application/list-project-categories.use-case.js';
import { ListProjects } from './application/list-projects.use-case.js';
import { RenameProjectCategory } from './application/rename-project-category.use-case.js';
import { UpdateAccount } from './application/update-account.use-case.js';
import { UpdateProject } from './application/update-project.use-case.js';
import { AccountRepository } from './domain/account.repository.js';
import { ProjectCategoryRepository } from './domain/project-category.repository.js';
import { ProjectRepository } from './domain/project.repository.js';
import { AccountsController } from './http/accounts.controller.js';
import { ProjectCategoriesController } from './http/project-categories.controller.js';
import { ProjectsController } from './http/projects.controller.js';
import { PrismaAccountRepository } from './infrastructure/prisma-account.repository.js';
import { PrismaProjectCategoryRepository } from './infrastructure/prisma-project-category.repository.js';
import { PrismaProjectRepository } from './infrastructure/prisma-project.repository.js';
import { TreasuryFacade } from './public/treasury.facade.js';

@Module({
  imports: [DirectoryModule],
  controllers: [AccountsController, ProjectCategoriesController, ProjectsController],
  providers: [
    TreasuryFacade,
    ListAccounts,
    CreateAccount,
    UpdateAccount,
    ListProjectCategories,
    CreateProjectCategory,
    RenameProjectCategory,
    ListProjects,
    CreateProject,
    UpdateProject,
    { provide: AccountRepository, useClass: PrismaAccountRepository },
    { provide: ProjectCategoryRepository, useClass: PrismaProjectCategoryRepository },
    { provide: ProjectRepository, useClass: PrismaProjectRepository },
  ],
  exports: [TreasuryFacade],
})
export class TreasuryModule {}

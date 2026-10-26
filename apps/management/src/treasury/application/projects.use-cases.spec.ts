import { beforeEach, describe, expect, it } from 'vitest';
import {
  ProjectCategoryNameAlreadyUsedError,
  ProjectCategoryNotFoundError,
  type ProjectCategory,
} from '../domain/project-category.js';
import {
  ProjectNameAlreadyUsedError,
  ProjectNotFoundError,
  type Project,
} from '../domain/project.js';
import { InMemoryProjectCategoryRepository } from '../infrastructure/in-memory-project-category.repository.js';
import { InMemoryProjectRepository } from '../infrastructure/in-memory-project.repository.js';
import { CreateProjectCategory } from './create-project-category.use-case.js';
import { CreateProject } from './create-project.use-case.js';
import { ListProjectCategories } from './list-project-categories.use-case.js';
import { ListProjects } from './list-projects.use-case.js';
import { RenameProjectCategory } from './rename-project-category.use-case.js';
import { UpdateProject } from './update-project.use-case.js';

const associationId = 'a55c1a7e-0000-4000-8000-000000000001';
const otherAssociationId = 'b0000000-0000-4000-8000-000000000002';
const unknownId = 'f0000000-0000-4000-8000-000000000099';

const financing: ProjectCategory = {
  id: 'f1000000-0000-4000-8000-000000000002',
  associationId,
  name: 'Financement',
};

const bar: ProjectCategory = {
  id: 'f1000000-0000-4000-8000-000000000001',
  associationId,
  name: 'Bar',
};

const foreignCamp: ProjectCategory = {
  id: 'f1000000-0000-4000-8000-000000000003',
  associationId: otherAssociationId,
  name: 'Camp',
};

const brunch: Project = {
  id: 'f2000000-0000-4000-8000-000000000002',
  associationId,
  categoryId: financing.id,
  name: 'Brunch #1',
  isActive: true,
};

const barProject: Project = {
  id: 'f2000000-0000-4000-8000-000000000001',
  associationId,
  categoryId: bar.id,
  name: 'Bar',
  isActive: true,
};

const foreignProject: Project = {
  id: 'f2000000-0000-4000-8000-000000000003',
  associationId: otherAssociationId,
  categoryId: foreignCamp.id,
  name: 'Camp',
  isActive: true,
};

let categories: InMemoryProjectCategoryRepository;
let projects: InMemoryProjectRepository;

beforeEach(() => {
  categories = new InMemoryProjectCategoryRepository([financing, bar, foreignCamp]);
  projects = new InMemoryProjectRepository([brunch, barProject, foreignProject]);
});

describe('ListProjectCategories', () => {
  it("lists only the association's categories, by name", async () => {
    expect(await new ListProjectCategories(categories).execute(associationId)).toEqual([
      bar,
      financing,
    ]);
  });
});

describe('CreateProjectCategory', () => {
  it('creates a category', async () => {
    const created = await new CreateProjectCategory(categories).execute(associationId, {
      name: 'Camp',
    });

    expect(created).toEqual({ id: created.id, associationId, name: 'Camp' });
    expect(await categories.findAll(associationId)).toContainEqual(created);
  });

  it('refuses a category name already used, ignoring case', async () => {
    await expect(
      new CreateProjectCategory(categories).execute(associationId, { name: 'BAR' }),
    ).rejects.toBeInstanceOf(ProjectCategoryNameAlreadyUsedError);
  });
});

describe('RenameProjectCategory', () => {
  let renameCategory: RenameProjectCategory;

  beforeEach(() => {
    renameCategory = new RenameProjectCategory(categories);
  });

  it('renames a category', async () => {
    const renamed = await renameCategory.execute(associationId, bar.id, { name: 'Bar et soirées' });

    expect(renamed).toEqual({ ...bar, name: 'Bar et soirées' });
    expect(await categories.findById(associationId, bar.id)).toEqual(renamed);
  });

  it('keeps its own category name with another case', async () => {
    expect((await renameCategory.execute(associationId, bar.id, { name: 'BAR' })).name).toBe('BAR');
  });

  it('refuses the name of another category', async () => {
    await expect(
      renameCategory.execute(associationId, bar.id, { name: 'financement' }),
    ).rejects.toBeInstanceOf(ProjectCategoryNameAlreadyUsedError);
  });

  it('refuses to rename an unknown or foreign category', async () => {
    await expect(
      renameCategory.execute(associationId, unknownId, { name: 'X' }),
    ).rejects.toBeInstanceOf(ProjectCategoryNotFoundError);
    await expect(
      renameCategory.execute(associationId, foreignCamp.id, { name: 'X' }),
    ).rejects.toBeInstanceOf(ProjectCategoryNotFoundError);
  });
});

describe('ListProjects', () => {
  it("lists only the association's projects, by name", async () => {
    expect(await new ListProjects(projects).execute(associationId)).toEqual([barProject, brunch]);
  });
});

describe('CreateProject', () => {
  let createProject: CreateProject;

  beforeEach(() => {
    createProject = new CreateProject(categories, projects);
  });

  it('creates a project in a category', async () => {
    const created = await createProject.execute(associationId, {
      name: 'Brunch #2',
      categoryId: financing.id,
    });

    expect(created).toEqual({
      id: created.id,
      associationId,
      categoryId: financing.id,
      name: 'Brunch #2',
      isActive: true,
    });
    expect(await projects.findAll(associationId)).toContainEqual(created);
  });

  it('accepts a project named like its category', async () => {
    const created = await createProject.execute(associationId, {
      name: 'Financement',
      categoryId: financing.id,
    });

    expect(created.name).toBe('Financement');
  });

  it('refuses a project name already used, ignoring case', async () => {
    await expect(
      createProject.execute(associationId, { name: 'brunch #1', categoryId: bar.id }),
    ).rejects.toBeInstanceOf(ProjectNameAlreadyUsedError);
  });

  it('refuses a project in a foreign or unknown category', async () => {
    await expect(
      createProject.execute(associationId, { name: 'Camp', categoryId: foreignCamp.id }),
    ).rejects.toBeInstanceOf(ProjectCategoryNotFoundError);
    await expect(
      createProject.execute(associationId, { name: 'Camp', categoryId: unknownId }),
    ).rejects.toBeInstanceOf(ProjectCategoryNotFoundError);
  });
});

describe('UpdateProject', () => {
  let updateProject: UpdateProject;

  beforeEach(() => {
    updateProject = new UpdateProject(categories, projects);
  });

  it('moves a project to another category', async () => {
    const moved = await updateProject.execute(associationId, brunch.id, { categoryId: bar.id });

    expect(moved).toEqual({ ...brunch, categoryId: bar.id });
    expect(await projects.findById(associationId, brunch.id)).toEqual(moved);
  });

  it('renames a project', async () => {
    expect(
      (await updateProject.execute(associationId, brunch.id, { name: 'Brunch de Toussaint' })).name,
    ).toBe('Brunch de Toussaint');
  });

  it('keeps a project unchanged with an empty change set', async () => {
    expect(await updateProject.execute(associationId, brunch.id, {})).toEqual(brunch);
  });

  it('refuses the name of another project', async () => {
    await expect(
      updateProject.execute(associationId, brunch.id, { name: 'BAR' }),
    ).rejects.toBeInstanceOf(ProjectNameAlreadyUsedError);
  });

  it('refuses to move a project into a foreign category', async () => {
    await expect(
      updateProject.execute(associationId, brunch.id, { categoryId: foreignCamp.id }),
    ).rejects.toBeInstanceOf(ProjectCategoryNotFoundError);
    expect(await projects.findById(associationId, brunch.id)).toEqual(brunch);
  });

  it('refuses to update an unknown or foreign project', async () => {
    await expect(
      updateProject.execute(associationId, unknownId, { name: 'X' }),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
    await expect(
      updateProject.execute(associationId, foreignProject.id, { name: 'X' }),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
  });
});

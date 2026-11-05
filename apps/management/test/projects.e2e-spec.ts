import {
  projectCategoryListSchema,
  projectCategorySchema,
  projectListSchema,
  projectSchema,
  type NewProject,
  type ProjectChanges,
} from '@ardoise/types';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { DEMO_ASSOCIATION_ID } from '../src/association-context/demo-association-context.source.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { ProjectCategoryNameAlreadyUsedError } from '../src/treasury/domain/project-category.js';
import { ProjectCategoryRepository } from '../src/treasury/domain/project-category.repository.js';
import { ProjectNameAlreadyUsedError } from '../src/treasury/domain/project.js';
import { ProjectRepository } from '../src/treasury/domain/project.repository.js';

const OTHER_ASSOCIATION = 'b0000000-0000-4000-8000-000000000002';
const FOREIGN_CATEGORY = 'f1000000-0000-4000-8000-000000000099';
const FOREIGN_PROJECT = 'f2000000-0000-4000-8000-000000000099';

describe('Projects and project categories', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const server = () => app.getHttpServer();
  const createCategory = (name: string) =>
    request(server()).post('/project-categories').send({ name });
  const renameCategory = (categoryId: string, name: string) =>
    request(server()).patch(`/project-categories/${categoryId}`).send({ name });
  const createProject = (newProject: NewProject) =>
    request(server()).post('/projects').send(newProject);
  const updateProject = (projectId: string, changes: ProjectChanges) =>
    request(server()).patch(`/projects/${projectId}`).send(changes);
  const category = async (name: string) =>
    projectCategorySchema.parse((await createCategory(name)).body);
  const project = async (newProject: NewProject) =>
    projectSchema.parse((await createProject(newProject)).body);

  const insertForeignCategory = () =>
    prisma.projectCategory.create({
      data: { id: FOREIGN_CATEGORY, associationId: OTHER_ASSOCIATION, name: 'Camp' },
    });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.project.deleteMany();
    await prisma.projectCategory.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a category and lists it', async () => {
    const response = await createCategory(' Bar ');

    expect(response.status).toBe(201);
    const created = projectCategorySchema.parse(response.body);
    expect(created).toEqual({ id: created.id, name: 'Bar' });
    const listed = await request(server()).get('/project-categories');
    expect(projectCategoryListSchema.parse(listed.body)).toEqual([created]);
    const stored = await prisma.projectCategory.findUniqueOrThrow({ where: { id: created.id } });
    expect(stored.associationId).toBe(DEMO_ASSOCIATION_ID);
  });

  it('rejects a duplicate category name, ignoring case', async () => {
    await category('Bar');

    expect((await createCategory('BAR')).status).toBe(409);
  });

  it('renames a category', async () => {
    const bar = await category('Bar');

    const response = await renameCategory(bar.id, 'Bar et soirées');

    expect(response.status).toBe(200);
    expect(projectCategorySchema.parse(response.body)).toEqual({ ...bar, name: 'Bar et soirées' });
  });

  it('creates a project in a category and lists it', async () => {
    const financing = await category('Financement');

    const response = await createProject({ name: 'Brunch #1', categoryId: financing.id });

    expect(response.status).toBe(201);
    const created = projectSchema.parse(response.body);
    expect(created).toEqual({ id: created.id, name: 'Brunch #1', categoryId: financing.id });
    const listed = await request(server()).get('/projects');
    expect(projectListSchema.parse(listed.body)).toEqual([created]);
  });

  it('rejects a duplicate project name, ignoring case', async () => {
    const bar = await category('Bar');
    await project({ name: 'Bar', categoryId: bar.id });

    expect((await createProject({ name: 'bar', categoryId: bar.id })).status).toBe(409);
  });

  it('moves a project to another category', async () => {
    const bar = await category('Bar');
    const financing = await category('Financement');
    const brunch = await project({ name: 'Brunch #1', categoryId: bar.id });

    const response = await updateProject(brunch.id, { categoryId: financing.id });

    expect(response.status).toBe(200);
    expect(projectSchema.parse(response.body)).toEqual({ ...brunch, categoryId: financing.id });
  });

  it("answers 404 for a project in another association's category", async () => {
    await insertForeignCategory();
    const bar = await category('Bar');
    const brunch = await project({ name: 'Brunch #1', categoryId: bar.id });

    expect((await createProject({ name: 'Camp', categoryId: FOREIGN_CATEGORY })).status).toBe(404);
    expect((await updateProject(brunch.id, { categoryId: FOREIGN_CATEGORY })).status).toBe(404);
    const stored = await prisma.project.findUniqueOrThrow({ where: { id: brunch.id } });
    expect(stored.categoryId).toBe(bar.id);
  });

  it("answers 404 for another association's category or project, and for malformed ids", async () => {
    await insertForeignCategory();
    await prisma.project.create({
      data: {
        id: FOREIGN_PROJECT,
        associationId: OTHER_ASSOCIATION,
        categoryId: FOREIGN_CATEGORY,
        name: 'Camp',
      },
    });

    expect((await renameCategory(FOREIGN_CATEGORY, 'Volée')).status).toBe(404);
    expect((await updateProject(FOREIGN_PROJECT, { name: 'Volé' })).status).toBe(404);
    expect((await renameCategory('not-a-uuid', 'X')).status).toBe(404);
    expect((await updateProject('not-a-uuid', { name: 'X' })).status).toBe(404);
  });

  it('reports a name taken by a concurrent creation as already used', async () => {
    const categories = app.get(ProjectCategoryRepository, { strict: false });
    const projects = app.get(ProjectRepository, { strict: false });
    const bar = { associationId: DEMO_ASSOCIATION_ID, name: 'Bar' };
    await categories.create({ ...bar, id: 'f1000000-0000-4000-8000-000000000010' });

    await expect(
      categories.create({ ...bar, id: 'f1000000-0000-4000-8000-000000000011' }),
    ).rejects.toBeInstanceOf(ProjectCategoryNameAlreadyUsedError);

    const brunch = {
      associationId: DEMO_ASSOCIATION_ID,
      categoryId: 'f1000000-0000-4000-8000-000000000010',
      name: 'Brunch #1',
      isActive: true,
    };
    await projects.create({ ...brunch, id: 'f2000000-0000-4000-8000-000000000010' });
    await expect(
      projects.create({ ...brunch, id: 'f2000000-0000-4000-8000-000000000011' }),
    ).rejects.toBeInstanceOf(ProjectNameAlreadyUsedError);
  });
});

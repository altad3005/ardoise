import {
  accountSchema,
  projectCategorySchema,
  projectSchema,
  treasurySettingsSchema,
  type TreasurySettings,
} from '@ardoise/types';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/database/prisma.service.js';

const OTHER_ASSOCIATION = 'b0000000-0000-4000-8000-000000000002';
const FOREIGN_CATEGORY = 'f1000000-0000-4000-8000-000000000099';
const FOREIGN_PROJECT = 'f2000000-0000-4000-8000-000000000099';

const emptySettings: TreasurySettings = {
  defaultProjectId: null,
  stockProjectId: null,
  defaultCashAccountId: null,
};

describe('Treasury settings', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const server = () => app.getHttpServer();
  const getSettings = () => request(server()).get('/treasury-settings');
  const putSettings = (values: object) => request(server()).put('/treasury-settings').send(values);
  const project = async (name: string) => {
    const category = projectCategorySchema.parse(
      (await request(server()).post('/project-categories').send({ name: 'Bar' })).body,
    );
    return projectSchema.parse(
      (await request(server()).post('/projects').send({ name, categoryId: category.id })).body,
    );
  };
  const account = async (name: string, type: 'BANK' | 'CASH') =>
    accountSchema.parse(
      (await request(server()).post('/accounts').send({ name, type, openingBalanceCents: 0 }))
        .body,
    );

  const clearTreasury = async () => {
    await prisma.treasurySettings.deleteMany();
    await prisma.project.deleteMany();
    await prisma.projectCategory.deleteMany();
    await prisma.account.deleteMany();
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(clearTreasury);

  afterAll(async () => {
    await clearTreasury();
    await app.close();
  });

  it('returns empty settings when nothing was saved', async () => {
    const response = await getSettings();

    expect(response.status).toBe(200);
    expect(treasurySettingsSchema.parse(response.body)).toEqual(emptySettings);
  });

  it('saves the settings and returns them', async () => {
    const stock = await project('Stock bar');
    const cashRegister = await account('Caisse du bar', 'CASH');
    const values = {
      defaultProjectId: stock.id,
      stockProjectId: stock.id,
      defaultCashAccountId: cashRegister.id,
    };

    const response = await putSettings(values);

    expect(response.status).toBe(200);
    expect(treasurySettingsSchema.parse(response.body)).toEqual(values);
    expect(treasurySettingsSchema.parse((await getSettings()).body)).toEqual(values);
  });

  it('rejects a project of another association', async () => {
    await prisma.projectCategory.create({
      data: { id: FOREIGN_CATEGORY, associationId: OTHER_ASSOCIATION, name: 'Camp' },
    });
    await prisma.project.create({
      data: {
        id: FOREIGN_PROJECT,
        associationId: OTHER_ASSOCIATION,
        categoryId: FOREIGN_CATEGORY,
        name: 'Camp',
      },
    });

    const response = await putSettings({ ...emptySettings, stockProjectId: FOREIGN_PROJECT });

    expect(response.status).toBe(404);
    expect(await prisma.treasurySettings.count()).toBe(0);
  });

  it('rejects a bank account as default cash account', async () => {
    const currentAccount = await account('Compte courant', 'BANK');

    const response = await putSettings({
      ...emptySettings,
      defaultCashAccountId: currentAccount.id,
    });

    expect(response.status).toBe(422);
  });

  it('rejects an identifier that is not a uuid', async () => {
    expect((await putSettings({ ...emptySettings, defaultProjectId: 'bar' })).status).toBe(400);
  });
});

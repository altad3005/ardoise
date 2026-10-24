import {
  accountListSchema,
  accountSchema,
  type AccountChanges,
  type NewAccount,
} from '@ardoise/types';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { DEMO_ASSOCIATION_ID } from '../src/association-context/demo-association-context.source.js';
import { PrismaService } from '../src/database/prisma.service.js';

const OTHER_ASSOCIATION = 'b0000000-0000-4000-8000-000000000002';
const FOREIGN_ACCOUNT = 'e0000000-0000-4000-8000-000000000099';

const cashRegister: NewAccount = {
  name: 'Caisse du bar',
  type: 'CASH',
  openingBalanceCents: 15000,
};

describe('Treasury accounts', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const list = () => request(app.getHttpServer()).get('/accounts');
  const create = (newAccount: Partial<NewAccount>) =>
    request(app.getHttpServer()).post('/accounts').send(newAccount);
  const update = (accountId: string, changes: AccountChanges) =>
    request(app.getHttpServer()).patch(`/accounts/${accountId}`).send(changes);
  const createCashRegister = async () => accountSchema.parse((await create(cashRegister)).body);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.account.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a cash account and lists it with its balance', async () => {
    const response = await create({ ...cashRegister, name: ' Caisse du bar ' });

    expect(response.status).toBe(201);
    const created = accountSchema.parse(response.body);
    expect(created).toEqual({
      id: created.id,
      name: 'Caisse du bar',
      type: 'CASH',
      openingBalanceCents: 15000,
      balanceCents: 15000,
    });
    expect(accountListSchema.parse((await list()).body)).toEqual([created]);
    const stored = await prisma.account.findUniqueOrThrow({ where: { id: created.id } });
    expect(stored.associationId).toBe(DEMO_ASSOCIATION_ID);
  });

  it('accepts an overdrawn bank account', async () => {
    const response = await create({
      name: 'Compte du camp',
      type: 'BANK',
      openingBalanceCents: -4560,
    });

    expect(response.status).toBe(201);
    expect(accountSchema.parse(response.body).balanceCents).toBe(-4560);
  });

  it('rejects a negative cash account', async () => {
    expect((await create({ ...cashRegister, openingBalanceCents: -2000 })).status).toBe(400);
  });

  it('rejects a duplicate name, ignoring case', async () => {
    await createCashRegister();

    expect((await create({ ...cashRegister, name: 'CAISSE DU BAR' })).status).toBe(409);
  });

  it('corrects name and opening balance', async () => {
    const created = await createCashRegister();

    const response = await update(created.id, {
      name: 'Caisse principale',
      openingBalanceCents: 20000,
    });

    expect(response.status).toBe(200);
    expect(accountSchema.parse(response.body)).toEqual({
      ...created,
      name: 'Caisse principale',
      openingBalanceCents: 20000,
      balanceCents: 20000,
    });
    expect(accountListSchema.parse((await list()).body)[0]?.name).toBe('Caisse principale');
  });

  it('rejects a negative opening balance on an existing cash account', async () => {
    const created = await createCashRegister();

    expect((await update(created.id, { openingBalanceCents: -100 })).status).toBe(400);
  });

  it('accepts an empty change set', async () => {
    const created = await createCashRegister();

    const response = await update(created.id, {});

    expect(response.status).toBe(200);
    expect(accountSchema.parse(response.body)).toEqual(created);
  });

  it('answers 404 for an account of another association', async () => {
    await prisma.account.create({
      data: {
        id: FOREIGN_ACCOUNT,
        associationId: OTHER_ASSOCIATION,
        name: 'Compte étranger',
        type: 'BANK',
        openingBalanceCents: 0,
      },
    });

    expect((await update(FOREIGN_ACCOUNT, { name: 'Volé' })).status).toBe(404);
    expect(accountListSchema.parse((await list()).body)).toEqual([]);
  });

  it('answers 404 for a malformed account id', async () => {
    expect((await update('not-a-uuid', { name: 'Caisse' })).status).toBe(404);
  });
});

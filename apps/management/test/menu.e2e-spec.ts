import { saleItemListSchema, saleItemSchema, type CatalogueSaleItem } from '@ardoise/types';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { AssociationContextSource } from '../src/association-context/association-context.source.js';
import { DEMO_ASSOCIATION_ID } from '../src/association-context/demo-association-context.source.js';
import { PrismaService } from '../src/database/prisma.service.js';

const UNKNOWN_SALE_ITEM = 'e0000000-0000-4000-8000-000000000099';

describe('Checkout menu', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let entryTicket: CatalogueSaleItem;
  let brunchTicket: CatalogueSaleItem;

  const server = () => app.getHttpServer();
  const getMenu = async () => saleItemListSchema.parse((await request(server()).get('/menu')).body);
  const composeMenu = (saleItemIds: string[]) =>
    request(server()).put('/menu').send({ saleItemIds });
  const createStockless = async (name: string) =>
    saleItemSchema.parse(
      (await request(server()).post('/stockless-sale-items').send({ name, basePriceCents: 500 }))
        .body,
    );

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.saleItem.deleteMany();
    entryTicket = await createStockless('Entrée soirée');
    brunchTicket = await createStockless('Ticket brunch');
  });

  afterAll(async () => {
    await app.close();
  });

  it('starts with an empty menu, new items staying off it', async () => {
    expect(entryTicket.menuPosition).toBeNull();
    expect(await getMenu()).toEqual([]);
  });

  it('composes the menu in the chosen order', async () => {
    const response = await composeMenu([brunchTicket.id, entryTicket.id]);

    expect(response.status).toBe(200);
    const expected = [
      { ...brunchTicket, menuPosition: 0 },
      { ...entryTicket, menuPosition: 1 },
    ];
    expect(saleItemListSchema.parse(response.body)).toEqual(expected);
    expect(await getMenu()).toEqual(expected);
  });

  it('reorders the menu and takes the items left out off it', async () => {
    await composeMenu([brunchTicket.id, entryTicket.id]);
    await composeMenu([entryTicket.id, brunchTicket.id]);
    await composeMenu([entryTicket.id]);

    expect(await getMenu()).toEqual([{ ...entryTicket, menuPosition: 0 }]);
    const stored = await prisma.saleItem.findUniqueOrThrow({ where: { id: brunchTicket.id } });
    expect(stored.menuPosition).toBeNull();
    expect(stored.associationId).toBe(DEMO_ASSOCIATION_ID);
  });

  it('answers 400 to an item listed twice or a malformed id', async () => {
    expect((await composeMenu([entryTicket.id, entryTicket.id])).status).toBe(400);
    expect((await composeMenu(['not-a-uuid'])).status).toBe(400);
  });

  it('answers 404 to an unknown item and keeps the menu', async () => {
    await composeMenu([entryTicket.id]);

    expect((await composeMenu([brunchTicket.id, UNKNOWN_SALE_ITEM])).status).toBe(404);
    expect(await getMenu()).toEqual([{ ...entryTicket, menuPosition: 0 }]);
  });
});

describe('Checkout menu for a viewer', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AssociationContextSource)
      .useValue({
        resolve: async () => ({ associationId: DEMO_ASSOCIATION_ID, roles: ['VIEWER'] }),
      })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lets a viewer read the menu but not compose it', async () => {
    const server = app.getHttpServer();
    expect((await request(server).get('/menu')).status).toBe(200);
    expect((await request(server).put('/menu').send({ saleItemIds: [] })).status).toBe(403);
  });
});

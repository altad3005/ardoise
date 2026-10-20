import { saleItemListSchema, saleItemSchema } from '@ardoise/types';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { AssociationContextSource } from '../src/association-context/association-context.source.js';
import { DEMO_ASSOCIATION_ID } from '../src/association-context/demo-association-context.source.js';
import { PrismaService } from '../src/database/prisma.service.js';

const RICARD = 'c0000000-0000-4000-8000-000000000017';
const VODKA = 'c0000000-0000-4000-8000-000000000019';
const UNKNOWN_SALE_ITEM = 'e0000000-0000-4000-8000-000000000099';

describe('Sale items', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const server = () => app.getHttpServer();
  const listForProduct = async (productId: string) =>
    saleItemListSchema.parse(
      (await request(server()).get(`/products/${productId}/sale-items`)).body,
    );
  const createForProduct = (productId: string, body: object) =>
    request(server()).post(`/products/${productId}/sale-items`).send(body);
  const createStockless = (body: object) =>
    request(server()).post('/stockless-sale-items').send(body);
  const update = (saleItemId: string, body: object) =>
    request(server()).put(`/sale-items/${saleItemId}`).send(body);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.saleItem.deleteMany();
    await prisma.associationProduct.deleteMany();
    await request(server()).put(`/products/${RICARD}/activation`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists the unpriced item created with the product', async () => {
    const [bottle] = await listForProduct(RICARD);

    expect(bottle).toEqual({
      id: bottle?.id,
      productId: RICARD,
      name: 'Ricard 1 L',
      consumedQuantity: 1,
      basePriceCents: null,
      isActive: true,
    });
  });

  it('creates a glass consuming a fraction of the bottle, listed first', async () => {
    const response = await createForProduct(RICARD, {
      name: ' Verre de pastis ',
      consumedQuantity: 0.05,
      basePriceCents: 200,
    });

    expect(response.status).toBe(201);
    const glass = saleItemSchema.parse(response.body);
    expect(glass).toEqual({
      id: glass.id,
      productId: RICARD,
      name: 'Verre de pastis',
      consumedQuantity: 0.05,
      basePriceCents: 200,
      isActive: true,
    });
    expect((await listForProduct(RICARD)).map((saleItem) => saleItem.name)).toEqual([
      'Verre de pastis',
      'Ricard 1 L',
    ]);
    const stored = await prisma.saleItem.findUniqueOrThrow({ where: { id: glass.id } });
    expect(stored.associationId).toBe(DEMO_ASSOCIATION_ID);
  });

  it('answers 404 to an item for an inactive product', async () => {
    const response = await createForProduct(VODKA, {
      name: 'Verre de vodka',
      consumedQuantity: 0.05,
      basePriceCents: 300,
    });

    expect(response.status).toBe(404);
  });

  it('answers 409 to a name already used', async () => {
    const response = await createForProduct(RICARD, {
      name: 'ricard 1 l',
      consumedQuantity: 1,
      basePriceCents: 2800,
    });

    expect(response.status).toBe(409);
  });

  it('answers 400 to an invalid item', async () => {
    expect(
      (await createForProduct(RICARD, { name: 'Verre', consumedQuantity: 0, basePriceCents: 200 }))
        .status,
    ).toBe(400);
    expect(
      (await createForProduct(RICARD, { name: 'Verre', consumedQuantity: 1, basePriceCents: -1 }))
        .status,
    ).toBe(400);
  });

  it('creates and lists a stockless item', async () => {
    const response = await createStockless({ name: 'Entrée soirée', basePriceCents: 500 });

    expect(response.status).toBe(201);
    const ticket = saleItemSchema.parse(response.body);
    expect(ticket).toMatchObject({ productId: null, consumedQuantity: null, basePriceCents: 500 });
    const listed = saleItemListSchema.parse(
      (await request(server()).get('/stockless-sale-items')).body,
    );
    expect(listed).toEqual([ticket]);
  });

  it('sets the price of the item created with the product', async () => {
    const [bottle] = await listForProduct(RICARD);

    const response = await update(bottle!.id, {
      name: 'Bouteille de pastis',
      consumedQuantity: 1,
      basePriceCents: 2800,
    });

    expect(response.status).toBe(200);
    expect(await listForProduct(RICARD)).toEqual([
      { ...bottle, name: 'Bouteille de pastis', basePriceCents: 2800 },
    ]);
  });

  it('answers 400 to a consumed quantity for a stockless item', async () => {
    const ticket = saleItemSchema.parse(
      (await createStockless({ name: 'Entrée soirée', basePriceCents: 500 })).body,
    );

    const response = await update(ticket.id, {
      name: 'Entrée soirée',
      consumedQuantity: 1,
      basePriceCents: 500,
    });

    expect(response.status).toBe(400);
  });

  it('answers 404 to an unknown or malformed item', async () => {
    const changes = { name: 'Entrée', basePriceCents: 500 };
    expect((await update(UNKNOWN_SALE_ITEM, changes)).status).toBe(404);
    expect((await update('not-a-uuid', changes)).status).toBe(404);
  });
});

describe('Sale items for a viewer', () => {
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

  it('lets a viewer list items', async () => {
    expect((await request(app.getHttpServer()).get('/stockless-sale-items')).status).toBe(200);
    expect((await request(app.getHttpServer()).get(`/products/${RICARD}/sale-items`)).status).toBe(
      200,
    );
  });

  it('forbids a viewer to create or update an item', async () => {
    const server = app.getHttpServer();
    const ticket = { name: 'Entrée soirée', basePriceCents: 500 };
    expect((await request(server).post('/stockless-sale-items').send(ticket)).status).toBe(403);
    expect(
      (
        await request(server)
          .post(`/products/${RICARD}/sale-items`)
          .send({ ...ticket, consumedQuantity: 1 })
      ).status,
    ).toBe(403);
    expect(
      (await request(server).put(`/sale-items/${UNKNOWN_SALE_ITEM}`).send(ticket)).status,
    ).toBe(403);
  });
});

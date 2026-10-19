import {
  productListSchema,
  productSchema,
  type CatalogueProduct,
  type NewProduct,
} from '@ardoise/types';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { AssociationContextSource } from '../src/association-context/association-context.source.js';
import { DEMO_ASSOCIATION_ID } from '../src/association-context/demo-association-context.source.js';
import { PrismaService } from '../src/database/prisma.service.js';

const JUPILER = 'c0000000-0000-4000-8000-000000000001';
const UNKNOWN_PRODUCT = 'c0000000-0000-4000-8000-000000000099';

describe('Catalogue products', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const listProducts = async (): Promise<CatalogueProduct[]> =>
    productListSchema.parse((await request(app.getHttpServer()).get('/products')).body);
  const activate = (productId: string) =>
    request(app.getHttpServer()).put(`/products/${productId}/activation`);
  const deactivate = (productId: string) =>
    request(app.getHttpServer()).delete(`/products/${productId}/activation`);
  const create = (newProduct: Partial<NewProduct>) =>
    request(app.getHttpServer()).post('/products').send(newProduct);
  const isJupilerActive = async () =>
    (await listProducts()).find((product) => product.id === JUPILER)?.isActive;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.saleItem.deleteMany();
    await prisma.associationProduct.deleteMany();
    await prisma.product.deleteMany({ where: { associationId: { not: null } } });
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists the 25 shared products, all inactive', async () => {
    const response = await request(app.getHttpServer()).get('/products');

    expect(response.status).toBe(200);
    const products = productListSchema.parse(response.body);
    expect(products).toHaveLength(25);
    expect(products.find((product) => product.id === JUPILER)).toEqual({
      id: JUPILER,
      name: 'Jupiler 25 cl',
      category: 'PILSNER',
      stockUnit: 'bouteille',
      isShared: true,
      isActive: false,
    });
    expect(products.every((product) => !product.isActive)).toBe(true);
  });

  it('activates a product and creates its sale item', async () => {
    expect((await activate(JUPILER)).status).toBe(204);

    expect(await isJupilerActive()).toBe(true);
    const saleItem = await prisma.saleItem.findFirstOrThrow({ where: { productId: JUPILER } });
    expect(saleItem.associationId).toBe(DEMO_ASSOCIATION_ID);
    expect(saleItem.name).toBe('Jupiler 25 cl');
    expect(saleItem.consumedQuantity.toString()).toBe('1');
    expect(saleItem.basePriceCents).toBeNull();
    expect(saleItem.isActive).toBe(true);
  });

  it('activates once under concurrent requests', async () => {
    const responses = await Promise.all([activate(JUPILER), activate(JUPILER)]);

    expect(responses.map((response) => response.status)).toEqual([204, 204]);
    expect(await prisma.saleItem.count()).toBe(1);
  });

  it('deactivates a product', async () => {
    await activate(JUPILER);

    expect((await deactivate(JUPILER)).status).toBe(204);

    expect(await isJupilerActive()).toBe(false);
  });

  it('reactivates without a second sale item', async () => {
    await activate(JUPILER);
    await deactivate(JUPILER);

    await activate(JUPILER);

    expect(await isJupilerActive()).toBe(true);
    expect(await prisma.saleItem.count()).toBe(1);
  });

  it('answers 404 to an unknown product', async () => {
    expect((await activate(UNKNOWN_PRODUCT)).status).toBe(404);
    expect((await deactivate(UNKNOWN_PRODUCT)).status).toBe(404);
  });

  it('creates an own product, active with its sale item', async () => {
    const response = await create({
      name: ' Chips paprika ',
      category: 'SOFT_DRINK',
      stockUnit: 'sachet',
    });

    expect(response.status).toBe(201);
    const created = productSchema.parse(response.body);
    expect(created).toEqual({
      id: created.id,
      name: 'Chips paprika',
      category: 'SOFT_DRINK',
      stockUnit: 'sachet',
      isShared: false,
      isActive: true,
    });
    expect((await listProducts()).find((product) => product.id === created.id)).toEqual(created);
    const saleItem = await prisma.saleItem.findFirstOrThrow({ where: { productId: created.id } });
    expect(saleItem.associationId).toBe(DEMO_ASSOCIATION_ID);
    expect(saleItem.basePriceCents).toBeNull();
  });

  it('answers 409 to a name already used', async () => {
    const response = await create({
      name: 'jupiler 25 cl',
      category: 'PILSNER',
      stockUnit: 'bouteille',
    });

    expect(response.status).toBe(409);
    expect(await prisma.product.count({ where: { associationId: { not: null } } })).toBe(0);
  });

  it('answers 400 to an invalid product', async () => {
    const response = await create({ name: '  ', category: 'PILSNER' });

    expect(response.status).toBe(400);
  });

  it('answers 404 to a malformed id', async () => {
    expect((await activate('not-a-uuid')).status).toBe(404);
  });
});

describe('Catalogue products for a viewer', () => {
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

  it('forbids a viewer to activate', async () => {
    const response = await request(app.getHttpServer()).put(`/products/${JUPILER}/activation`);

    expect(response.status).toBe(403);
  });

  it('forbids a viewer to create a product', async () => {
    const response = await request(app.getHttpServer())
      .post('/products')
      .send({ name: 'Chips paprika', category: 'SOFT_DRINK', stockUnit: 'sachet' });

    expect(response.status).toBe(403);
  });

  it('lets a viewer list products', async () => {
    const response = await request(app.getHttpServer()).get('/products');

    expect(response.status).toBe(200);
  });
});

describe('Requests without association context', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AssociationContextSource)
      .useValue({ resolve: async () => null })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects listing products', async () => {
    expect((await request(app.getHttpServer()).get('/products')).status).toBe(401);
  });

  it('keeps the health check public', async () => {
    expect((await request(app.getHttpServer()).get('/health')).status).toBe(200);
  });
});

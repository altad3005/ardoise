import { packagingListSchema, packagingSchema, type NewPackaging } from '@ardoise/types';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { AssociationContextSource } from '../src/association-context/association-context.source.js';
import { DEMO_ASSOCIATION_ID } from '../src/association-context/demo-association-context.source.js';
import { PrismaService } from '../src/database/prisma.service.js';

const JUPILER = 'c0000000-0000-4000-8000-000000000001';
const JUPILER_CRATE = 'd0000000-0000-4000-8000-000000000001';
const JUPILER_KEG = 'c0000000-0000-4000-8000-000000000008';
const UNKNOWN_PRODUCT = 'c0000000-0000-4000-8000-000000000099';

const packagingsUrl = (productId: string) => `/products/${productId}/packagings`;

describe('Purchase packagings', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const list = (productId: string) => request(app.getHttpServer()).get(packagingsUrl(productId));
  const create = (productId: string, newPackaging: Partial<NewPackaging>) =>
    request(app.getHttpServer()).post(packagingsUrl(productId)).send(newPackaging);
  const remove = (productId: string, packagingId: string) =>
    request(app.getHttpServer()).delete(`${packagingsUrl(productId)}/${packagingId}`);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.packaging.deleteMany({ where: { associationId: { not: null } } });
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists the shared packaging of a product', async () => {
    const response = await list(JUPILER);

    expect(response.status).toBe(200);
    expect(packagingListSchema.parse(response.body)).toEqual([
      { id: JUPILER_CRATE, label: 'bac de 24', unitCount: 24, isShared: true },
    ]);
  });

  it('lists no packaging for a keg, bought by the unit', async () => {
    expect(packagingListSchema.parse((await list(JUPILER_KEG)).body)).toEqual([]);
  });

  it('creates an own packaging on a shared product, listed smallest first', async () => {
    const response = await create(JUPILER, { label: ' pack de 12 ', unitCount: 12 });

    expect(response.status).toBe(201);
    const created = packagingSchema.parse(response.body);
    expect(created).toEqual({
      id: created.id,
      label: 'pack de 12',
      unitCount: 12,
      isShared: false,
    });
    const listed = packagingListSchema.parse((await list(JUPILER)).body);
    expect(listed.map((packaging) => packaging.label)).toEqual(['pack de 12', 'bac de 24']);
    const stored = await prisma.packaging.findUniqueOrThrow({ where: { id: created.id } });
    expect(stored.associationId).toBe(DEMO_ASSOCIATION_ID);
  });

  it('keeps a fractional unit count', async () => {
    const response = await create(JUPILER, { label: 'demi-bac', unitCount: 0.5 });

    expect(packagingSchema.parse(response.body).unitCount).toBe(0.5);
    const listed = packagingListSchema.parse((await list(JUPILER)).body);
    expect(listed[0]?.unitCount).toBe(0.5);
  });

  it('answers 409 to a label already used', async () => {
    const response = await create(JUPILER, { label: 'BAC DE 24', unitCount: 24 });

    expect(response.status).toBe(409);
    expect(await prisma.packaging.count({ where: { associationId: { not: null } } })).toBe(0);
  });

  it('answers 400 to an invalid packaging', async () => {
    expect((await create(JUPILER, { label: 'vide', unitCount: 0 })).status).toBe(400);
    expect((await create(JUPILER, { label: ' ', unitCount: 6 })).status).toBe(400);
  });

  it('answers 404 to an unknown product', async () => {
    expect((await list(UNKNOWN_PRODUCT)).status).toBe(404);
    expect((await create(UNKNOWN_PRODUCT, { label: 'pack de 6', unitCount: 6 })).status).toBe(404);
  });

  it('deletes an own packaging', async () => {
    const created = packagingSchema.parse(
      (await create(JUPILER, { label: 'pack de 12', unitCount: 12 })).body,
    );

    expect((await remove(JUPILER, created.id)).status).toBe(204);

    expect(packagingListSchema.parse((await list(JUPILER)).body)).toHaveLength(1);
  });

  it('answers 404 to the deletion of a shared packaging', async () => {
    expect((await remove(JUPILER, JUPILER_CRATE)).status).toBe(404);
    expect(await prisma.packaging.count({ where: { id: JUPILER_CRATE } })).toBe(1);
  });

  it('answers 404 to a malformed packaging id', async () => {
    expect((await remove(JUPILER, 'not-a-uuid')).status).toBe(404);
  });
});

describe('Purchase packagings for a viewer', () => {
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

  it('lets a viewer list packagings', async () => {
    expect((await request(app.getHttpServer()).get(packagingsUrl(JUPILER))).status).toBe(200);
  });

  it('forbids a viewer to create a packaging', async () => {
    const response = await request(app.getHttpServer())
      .post(packagingsUrl(JUPILER))
      .send({ label: 'pack de 12', unitCount: 12 });

    expect(response.status).toBe(403);
  });

  it('forbids a viewer to delete a packaging', async () => {
    const response = await request(app.getHttpServer()).delete(
      `${packagingsUrl(JUPILER)}/${JUPILER_CRATE}`,
    );

    expect(response.status).toBe(403);
  });
});

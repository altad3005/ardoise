import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/database/prisma.service.js';

const registration = {
  email: 'alex@mail.com',
  displayName: 'Alex',
  password: 'correct horse battery',
};

describe('POST /users', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const register = (body: object) => request(app.getHttpServer()).post('/users').send(body);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates an account', async () => {
    const response = await register(registration);

    expect(response.status).toBe(201);
    expect(Object.keys(response.body).toSorted()).toEqual(['displayName', 'email', 'id']);
  });

  it('normalizes the email', async () => {
    const response = await register({ ...registration, email: '  Alex@Mail.COM ' });

    expect(response.status).toBe(201);
    expect(response.body.email).toBe('alex@mail.com');
    expect((await register(registration)).status).toBe(409);
  });

  it('rejects an email that is already used', async () => {
    await register(registration);

    const response = await register({ ...registration, displayName: 'Another Alex' });

    expect(response.status).toBe(409);
  });

  it('answers 409, never 500, to simultaneous registrations', async () => {
    const responses = await Promise.all([register(registration), register(registration)]);

    expect(responses.map((response) => response.status).toSorted((a, b) => a - b)).toEqual([
      201, 409,
    ]);
  });

  it('accepts passwords of 12 and 128 characters', async () => {
    const shortest = await register({ ...registration, password: 'a'.repeat(12) });
    const longest = await register({
      ...registration,
      email: 'other@mail.com',
      password: 'a'.repeat(128),
    });

    expect(shortest.status).toBe(201);
    expect(longest.status).toBe(201);
  });

  it('rejects passwords of 11 and 129 characters', async () => {
    expect((await register({ ...registration, password: 'a'.repeat(11) })).status).toBe(400);
    expect((await register({ ...registration, password: 'a'.repeat(129) })).status).toBe(400);
  });

  it('rejects an invalid email', async () => {
    const response = await register({ ...registration, email: 'not-an-email' });

    expect(response.status).toBe(400);
  });

  it('rejects a blank display name', async () => {
    const response = await register({ ...registration, displayName: '   ' });

    expect(response.status).toBe(400);
  });

  it('ignores unexpected fields', async () => {
    const forcedId = '00000000-0000-0000-0000-000000000000';

    const response = await register({ ...registration, id: forcedId, passwordHash: 'x' });

    expect(response.status).toBe(201);
    expect(response.body.id).not.toBe(forcedId);
    const stored = await prisma.user.findUniqueOrThrow({ where: { email: registration.email } });
    expect(stored.passwordHash.startsWith('$argon2id$')).toBe(true);
  });

  it('never echoes the password in a validation error', async () => {
    const password = 'my-secret-1';

    const response = await register({ ...registration, password });

    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body)).not.toContain(password);
  });
});

describe('POST /users rate limiting', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects the sixth registration attempt within a minute', async () => {
    for (let attempt = 1; attempt <= 5; attempt++) {
      expect((await request(app.getHttpServer()).post('/users').send({})).status).toBe(400);
    }

    const response = await request(app.getHttpServer()).post('/users').send({});

    expect(response.status).toBe(429);
  });
});

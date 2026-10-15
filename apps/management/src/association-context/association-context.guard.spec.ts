import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host.js';
import { describe, expect, it } from 'vitest';
import type { AssociationContext } from './association-context.js';
import { AssociationContextGuard } from './association-context.guard.js';
import { AssociationContextSource } from './association-context.source.js';
import { Public, RequireRoles } from './decorators.js';

class TestController {
  @Public()
  publicRoute(this: void): void {}

  @RequireRoles('STOCK_MANAGER')
  stockRoute(this: void): void {}

  readRoute(this: void): void {}
}

class FixedContextSource extends AssociationContextSource {
  constructor(private readonly context: AssociationContext | null) {
    super();
  }

  async resolve(): Promise<AssociationContext | null> {
    return this.context;
  }
}

const contextWith = (roles: AssociationContext['roles']): AssociationContext => ({
  associationId: 'a55c1a7e-0000-4000-8000-000000000001',
  roles,
});

type FakeRequest = { associationContext?: AssociationContext };

function canActivate(
  context: AssociationContext | null,
  handler: () => void,
  request: FakeRequest = {},
): Promise<boolean> {
  const guard = new AssociationContextGuard(new Reflector(), new FixedContextSource(context));
  return guard.canActivate(new ExecutionContextHost([request], TestController, handler));
}

describe('AssociationContextGuard', async () => {
  it('lets a public route through without context', async () => {
    await expect(canActivate(null, TestController.prototype.publicRoute)).resolves.toBe(true);
  });

  it('rejects a request without context', async () => {
    await expect(canActivate(null, TestController.prototype.readRoute)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a context without the required role', async () => {
    await expect(
      canActivate(contextWith(['VIEWER']), TestController.prototype.stockRoute),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lets an administrator through any role requirement', async () => {
    await expect(
      canActivate(contextWith(['ADMINISTRATOR']), TestController.prototype.stockRoute),
    ).resolves.toBe(true);
  });

  it('stores the context on the request when no role is required', async () => {
    const request: FakeRequest = {};
    const context = contextWith(['VIEWER']);

    await expect(canActivate(context, TestController.prototype.readRoute, request)).resolves.toBe(
      true,
    );
    expect(request.associationContext).toBe(context);
  });
});

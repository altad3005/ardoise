import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@ardoise/types';
import type { AssociationContext, ContextualRequest } from './association-context.js';
import { AssociationContextSource } from './association-context.source.js';
import { IS_PUBLIC, REQUIRED_ROLES } from './decorators.js';

@Injectable()
export class AssociationContextGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly source: AssociationContextSource,
  ) {}

  async canActivate(executionContext: ExecutionContext): Promise<boolean> {
    const targets = [executionContext.getHandler(), executionContext.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) {
      return true;
    }

    const request = executionContext.switchToHttp().getRequest<ContextualRequest>();
    const context = await this.source.resolve(request);
    if (!context) {
      throw new UnauthorizedException();
    }

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(REQUIRED_ROLES, targets) ?? [];
    if (!hasAnyRole(context, requiredRoles)) {
      throw new ForbiddenException();
    }

    request.associationContext = context;
    return true;
  }
}

function hasAnyRole(context: AssociationContext, requiredRoles: readonly Role[]): boolean {
  return (
    requiredRoles.length === 0 ||
    context.roles.includes('ADMINISTRATOR') ||
    requiredRoles.some((role) => context.roles.includes(role))
  );
}

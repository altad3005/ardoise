import { SetMetadata, createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Role } from '@ardoise/types';
import type { AssociationContext, ContextualRequest } from './association-context.js';

export const IS_PUBLIC = 'isPublic';
export const REQUIRED_ROLES = 'requiredRoles';

export const Public = () => SetMetadata(IS_PUBLIC, true);

export const RequireRoles = (...roles: Role[]) => SetMetadata(REQUIRED_ROLES, roles);

export const CurrentContext = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AssociationContext => {
    const { associationContext } = context.switchToHttp().getRequest<ContextualRequest>();
    if (!associationContext) {
      throw new Error('No association context: is the route public?');
    }
    return associationContext;
  },
);

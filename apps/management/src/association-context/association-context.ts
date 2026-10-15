import type { Role } from '@ardoise/types';
import type { Request } from 'express';

export interface AssociationContext {
  associationId: string;
  roles: readonly Role[];
}

export type ContextualRequest = Request & { associationContext?: AssociationContext };

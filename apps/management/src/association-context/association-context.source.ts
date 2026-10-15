import type { Request } from 'express';
import type { AssociationContext } from './association-context.js';

export abstract class AssociationContextSource {
  abstract resolve(request: Request): AssociationContext | null;
}

import { Injectable } from '@nestjs/common';
import { roleSchema } from '@ardoise/types';
import type { AssociationContext } from './association-context.js';
import { AssociationContextSource } from './association-context.source.js';

export const DEMO_ASSOCIATION_ID = 'a55c1a7e-0000-4000-8000-000000000001';

// TODO: replace with a source reading the Identity access token (Accounts and associations milestone)
@Injectable()
export class DemoAssociationContextSource extends AssociationContextSource {
  async resolve(): Promise<AssociationContext> {
    return { associationId: DEMO_ASSOCIATION_ID, roles: roleSchema.options };
  }
}

import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AssociationContextGuard } from './association-context.guard.js';
import { AssociationContextSource } from './association-context.source.js';
import { DemoAssociationContextSource } from './demo-association-context.source.js';

@Global()
@Module({
  providers: [
    { provide: AssociationContextSource, useClass: DemoAssociationContextSource },
    { provide: APP_GUARD, useClass: AssociationContextGuard },
  ],
  exports: [AssociationContextSource],
})
export class AssociationContextModule {}

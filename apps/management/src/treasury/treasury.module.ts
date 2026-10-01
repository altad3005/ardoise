import { Module } from '@nestjs/common';
import { DirectoryModule } from '../directory/directory.module.js';
import { TreasuryFacade } from './public/treasury.facade.js';

@Module({
  imports: [DirectoryModule],
  providers: [TreasuryFacade],
  exports: [TreasuryFacade],
})
export class TreasuryModule {}

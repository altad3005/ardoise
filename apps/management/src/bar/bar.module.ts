import { Module } from '@nestjs/common';
import { DirectoryModule } from '../directory/directory.module.js';
import { TreasuryModule } from '../treasury/treasury.module.js';

@Module({
  imports: [TreasuryModule, DirectoryModule],
})
export class BarModule {}

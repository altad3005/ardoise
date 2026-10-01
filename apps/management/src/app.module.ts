import { Module } from '@nestjs/common';
import { BarModule } from './bar/bar.module.js';
import { DirectoryModule } from './directory/directory.module.js';
import { HealthModule } from './health/health.module.js';
import { TreasuryModule } from './treasury/treasury.module.js';

@Module({
  imports: [HealthModule, BarModule, TreasuryModule, DirectoryModule],
})
export class AppModule {}

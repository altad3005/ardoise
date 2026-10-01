import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BarModule } from './bar/bar.module.js';
import { validateEnvironment } from './config/environment.js';
import { DatabaseModule } from './database/database.module.js';
import { DirectoryModule } from './directory/directory.module.js';
import { HealthModule } from './health/health.module.js';
import { TreasuryModule } from './treasury/treasury.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    DatabaseModule,
    HealthModule,
    BarModule,
    TreasuryModule,
    DirectoryModule,
  ],
})
export class AppModule {}

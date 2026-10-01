import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import type { Environment } from './config/environment.js';

const app = await NestFactory.create(AppModule);
app.enableShutdownHooks();
await app.listen(app.get(ConfigService<Environment, true>).get('PORT'));

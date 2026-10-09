import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import type { Environment } from './config/environment.js';

const app = await NestFactory.create<NestExpressApplication>(AppModule);
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
app.enableShutdownHooks();
await app.listen(app.get(ConfigService<Environment, true>).get('PORT'));

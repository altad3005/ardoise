import { Module } from '@nestjs/common';
import { DirectoryFacade } from './public/directory.facade.js';

@Module({
  providers: [DirectoryFacade],
  exports: [DirectoryFacade],
})
export class DirectoryModule {}

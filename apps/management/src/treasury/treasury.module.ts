import { Module } from '@nestjs/common';
import { DirectoryModule } from '../directory/directory.module.js';
import { CreateAccount } from './application/create-account.use-case.js';
import { ListAccounts } from './application/list-accounts.use-case.js';
import { UpdateAccount } from './application/update-account.use-case.js';
import { AccountRepository } from './domain/account.repository.js';
import { AccountsController } from './http/accounts.controller.js';
import { PrismaAccountRepository } from './infrastructure/prisma-account.repository.js';
import { TreasuryFacade } from './public/treasury.facade.js';

@Module({
  imports: [DirectoryModule],
  controllers: [AccountsController],
  providers: [
    TreasuryFacade,
    ListAccounts,
    CreateAccount,
    UpdateAccount,
    { provide: AccountRepository, useClass: PrismaAccountRepository },
  ],
  exports: [TreasuryFacade],
})
export class TreasuryModule {}

import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  accountChangesSchema,
  newAccountSchema,
  type AccountChanges,
  type NewAccount,
  type TreasuryAccount,
} from '@ardoise/types';
import type { AssociationContext } from '../../association-context/association-context.js';
import { CurrentContext, RequireRoles } from '../../association-context/decorators.js';
import { CreateAccount } from '../application/create-account.use-case.js';
import { ListAccounts } from '../application/list-accounts.use-case.js';
import { UpdateAccount } from '../application/update-account.use-case.js';
import {
  AccountHasMovementsError,
  AccountNameAlreadyUsedError,
  AccountNotFoundError,
  NegativeCashBalanceError,
  type AccountWithBalance,
} from '../domain/account.js';

const idPipe = new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND });

@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly listAccounts: ListAccounts,
    private readonly createAccount: CreateAccount,
    private readonly updateAccount: UpdateAccount,
  ) {}

  @Get()
  @RequireRoles('TREASURER', 'VIEWER')
  async list(@CurrentContext() context: AssociationContext): Promise<TreasuryAccount[]> {
    const accounts = await this.listAccounts.execute(context.associationId);
    return accounts.map(toTreasuryAccount);
  }

  @Post()
  @RequireRoles('TREASURER')
  async create(
    @CurrentContext() context: AssociationContext,
    @Body({ schema: newAccountSchema }) newAccount: NewAccount,
  ): Promise<TreasuryAccount> {
    const account = await rethrowAsHttp(
      this.createAccount.execute(context.associationId, newAccount),
    );
    return toTreasuryAccount(account);
  }

  @Patch(':accountId')
  @RequireRoles('TREASURER')
  async update(
    @CurrentContext() context: AssociationContext,
    @Param('accountId', idPipe) accountId: string,
    @Body({ schema: accountChangesSchema }) changes: AccountChanges,
  ): Promise<TreasuryAccount> {
    const account = await rethrowAsHttp(
      this.updateAccount.execute(context.associationId, accountId, changes),
    );
    return toTreasuryAccount(account);
  }
}

function toTreasuryAccount(account: AccountWithBalance): TreasuryAccount {
  return {
    id: account.id,
    name: account.name,
    type: account.type,
    openingBalanceCents: account.openingBalanceCents,
    balanceCents: account.balanceCents,
  };
}

async function rethrowAsHttp<T>(operation: Promise<T>): Promise<T> {
  try {
    return await operation;
  } catch (error) {
    if (error instanceof AccountNotFoundError) {
      throw new NotFoundException('Account not found');
    }
    if (error instanceof NegativeCashBalanceError) {
      throw new BadRequestException('A cash account cannot have a negative opening balance');
    }
    if (error instanceof AccountNameAlreadyUsedError) {
      throw new ConflictException('An account already uses this name');
    }
    if (error instanceof AccountHasMovementsError) {
      throw new ConflictException('The account already has movements');
    }
    throw error;
  }
}

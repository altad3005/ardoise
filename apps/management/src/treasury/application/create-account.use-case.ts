import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { NewAccount } from '@ardoise/types';
import {
  AccountNameAlreadyUsedError,
  isNegativeCash,
  NegativeCashBalanceError,
  type AccountWithBalance,
} from '../domain/account.js';
import { AccountRepository } from '../domain/account.repository.js';

@Injectable()
export class CreateAccount {
  constructor(private readonly accounts: AccountRepository) {}

  async execute(associationId: string, newAccount: NewAccount): Promise<AccountWithBalance> {
    if (isNegativeCash(newAccount.type, newAccount.openingBalanceCents)) {
      throw new NegativeCashBalanceError();
    }
    if (await this.accounts.existsWithName(associationId, newAccount.name)) {
      throw new AccountNameAlreadyUsedError();
    }
    const account = { id: randomUUID(), associationId, ...newAccount, isActive: true };
    await this.accounts.create(account);
    return { ...account, balanceCents: account.openingBalanceCents };
  }
}

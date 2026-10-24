import { Injectable } from '@nestjs/common';
import type { AccountChanges } from '@ardoise/types';
import {
  AccountHasMovementsError,
  AccountNameAlreadyUsedError,
  AccountNotFoundError,
  isNegativeCash,
  NegativeCashBalanceError,
  type AccountWithBalance,
} from '../domain/account.js';
import { AccountRepository } from '../domain/account.repository.js';

@Injectable()
export class UpdateAccount {
  constructor(private readonly accounts: AccountRepository) {}

  async execute(
    associationId: string,
    accountId: string,
    changes: AccountChanges,
  ): Promise<AccountWithBalance> {
    const found = await this.accounts.findById(associationId, accountId);
    if (!found) {
      throw new AccountNotFoundError();
    }
    const { balanceCents, ...account } = found;
    const openingBalanceCents = changes.openingBalanceCents ?? account.openingBalanceCents;
    if (isNegativeCash(account.type, openingBalanceCents)) {
      throw new NegativeCashBalanceError();
    }
    if (
      openingBalanceCents !== account.openingBalanceCents &&
      (await this.accounts.hasMovements(associationId, accountId))
    ) {
      throw new AccountHasMovementsError();
    }
    const name = changes.name ?? account.name;
    if (await this.accounts.existsWithName(associationId, name, accountId)) {
      throw new AccountNameAlreadyUsedError();
    }
    const updated = { ...account, name, openingBalanceCents };
    await this.accounts.update(updated);
    return {
      ...updated,
      balanceCents: balanceCents - account.openingBalanceCents + openingBalanceCents,
    };
  }
}

import { Injectable } from '@nestjs/common';
import type { AccountWithBalance } from '../domain/account.js';
import { AccountRepository } from '../domain/account.repository.js';

@Injectable()
export class ListAccounts {
  constructor(private readonly accounts: AccountRepository) {}

  execute(associationId: string): Promise<AccountWithBalance[]> {
    return this.accounts.findAll(associationId);
  }
}

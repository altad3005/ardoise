import type { Account, AccountWithBalance } from './account.js';

export abstract class AccountRepository {
  abstract findAll(associationId: string): Promise<AccountWithBalance[]>;

  abstract findById(associationId: string, accountId: string): Promise<AccountWithBalance | null>;

  abstract existsWithName(
    associationId: string,
    name: string,
    exceptAccountId?: string,
  ): Promise<boolean>;

  abstract hasMovements(associationId: string, accountId: string): Promise<boolean>;

  abstract create(account: Account): Promise<void>;

  abstract update(account: Account): Promise<void>;
}

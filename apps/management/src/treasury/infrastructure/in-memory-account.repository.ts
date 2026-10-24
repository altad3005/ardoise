import type { Account, AccountWithBalance } from '../domain/account.js';
import { AccountRepository } from '../domain/account.repository.js';

export class InMemoryAccountRepository extends AccountRepository {
  private readonly accounts: Account[];

  constructor(
    accounts: readonly Account[],
    private readonly accountIdsWithMovements: readonly string[] = [],
  ) {
    super();
    this.accounts = [...accounts];
  }

  async findAll(associationId: string): Promise<AccountWithBalance[]> {
    return this.accounts
      .filter((account) => account.associationId === associationId)
      .toSorted(cashFirstThenName)
      .map(withBalance);
  }

  async findById(associationId: string, accountId: string): Promise<AccountWithBalance | null> {
    const account = this.accounts.find(
      (candidate) => candidate.id === accountId && candidate.associationId === associationId,
    );
    return account ? withBalance(account) : null;
  }

  async existsWithName(
    associationId: string,
    name: string,
    exceptAccountId?: string,
  ): Promise<boolean> {
    return this.accounts.some(
      (account) =>
        account.associationId === associationId &&
        account.id !== exceptAccountId &&
        account.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
  }

  async hasMovements(_associationId: string, accountId: string): Promise<boolean> {
    return this.accountIdsWithMovements.includes(accountId);
  }

  async create(account: Account): Promise<void> {
    this.accounts.push(account);
  }

  async update(account: Account): Promise<void> {
    const index = this.accounts.findIndex((candidate) => candidate.id === account.id);
    this.accounts[index] = account;
  }
}

function withBalance(account: Account): AccountWithBalance {
  return { ...account, balanceCents: account.openingBalanceCents };
}

function cashFirstThenName(first: Account, second: Account): number {
  return second.type.localeCompare(first.type) || first.name.localeCompare(second.name);
}

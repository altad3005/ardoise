import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import type { Account, AccountWithBalance } from '../domain/account.js';
import { AccountRepository } from '../domain/account.repository.js';

@Injectable()
export class PrismaAccountRepository extends AccountRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findAll(associationId: string): Promise<AccountWithBalance[]> {
    const accounts = await this.prisma.account.findMany({
      where: { associationId },
      orderBy: [{ type: 'desc' }, { name: 'asc' }],
    });
    return accounts.map(toAccountWithBalance);
  }

  async findById(associationId: string, accountId: string): Promise<AccountWithBalance | null> {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, associationId },
    });
    return account ? toAccountWithBalance(account) : null;
  }

  async existsWithName(
    associationId: string,
    name: string,
    exceptAccountId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.account.count({
      where: {
        associationId,
        name: { equals: name, mode: 'insensitive' },
        id: { not: exceptAccountId },
      },
    });
    return count > 0;
  }

  async hasMovements(_associationId: string, _accountId: string): Promise<boolean> {
    // TODO(US-42): look for movements on the account once they exist.
    return false;
  }

  async create(account: Account): Promise<void> {
    await this.prisma.account.create({ data: account });
  }

  async update({ id, associationId, ...account }: Account): Promise<void> {
    await this.prisma.account.update({ where: { id, associationId }, data: account });
  }
}

function toAccountWithBalance(account: Account): AccountWithBalance {
  return { ...account, balanceCents: account.openingBalanceCents };
}

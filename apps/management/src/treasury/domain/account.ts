import type { AccountType } from '@ardoise/types';

export interface Account {
  id: string;
  associationId: string;
  name: string;
  type: AccountType;
  openingBalanceCents: number;
  isActive: boolean;
}

export type AccountWithBalance = Account & { balanceCents: number };

export function isNegativeCash(type: AccountType, openingBalanceCents: number): boolean {
  return type === 'CASH' && openingBalanceCents < 0;
}

export class AccountNameAlreadyUsedError extends Error {
  constructor() {
    super('Account name already used');
  }
}

export class AccountNotFoundError extends Error {
  constructor() {
    super('Account not found');
  }
}

export class NegativeCashBalanceError extends Error {
  constructor() {
    super('A cash account cannot have a negative opening balance');
  }
}

export class AccountHasMovementsError extends Error {
  constructor() {
    super('Account already has movements');
  }
}

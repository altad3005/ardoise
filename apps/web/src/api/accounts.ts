import {
  accountListSchema,
  accountSchema,
  type AccountChanges,
  type NewAccount,
  type TreasuryAccount,
} from '@ardoise/types';
import { ApiError } from './api-error.ts';

const accountsUrl = '/api/management/accounts';

export async function fetchAccounts(): Promise<TreasuryAccount[]> {
  const response = await fetch(accountsUrl);
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  return accountListSchema.parse(await response.json());
}

export async function createAccount(newAccount: NewAccount): Promise<TreasuryAccount> {
  return sendAccount(accountsUrl, 'POST', newAccount);
}

export async function updateAccount(
  accountId: string,
  changes: AccountChanges,
): Promise<TreasuryAccount> {
  return sendAccount(`${accountsUrl}/${accountId}`, 'PATCH', changes);
}

async function sendAccount(
  url: string,
  method: 'POST' | 'PATCH',
  body: NewAccount | AccountChanges,
): Promise<TreasuryAccount> {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  return accountSchema.parse(await response.json());
}

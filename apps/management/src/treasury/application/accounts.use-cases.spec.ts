import { beforeEach, describe, expect, it } from 'vitest';
import {
  AccountHasMovementsError,
  AccountNameAlreadyUsedError,
  AccountNotFoundError,
  NegativeCashBalanceError,
  type Account,
} from '../domain/account.js';
import { InMemoryAccountRepository } from '../infrastructure/in-memory-account.repository.js';
import { CreateAccount } from './create-account.use-case.js';
import { ListAccounts } from './list-accounts.use-case.js';
import { UpdateAccount } from './update-account.use-case.js';

const associationId = 'a55c1a7e-0000-4000-8000-000000000001';
const otherAssociationId = 'b0000000-0000-4000-8000-000000000002';

const currentAccount: Account = {
  id: 'e0000000-0000-4000-8000-000000000001',
  associationId,
  name: 'Compte courant',
  type: 'BANK',
  openingBalanceCents: 164000,
  isActive: true,
};

const cashRegister: Account = {
  id: 'e0000000-0000-4000-8000-000000000002',
  associationId,
  name: 'Caisse du bar',
  type: 'CASH',
  openingBalanceCents: 15000,
  isActive: true,
};

const otherAssociationAccount: Account = {
  id: 'e0000000-0000-4000-8000-000000000003',
  associationId: otherAssociationId,
  name: 'Compte épargne',
  type: 'BANK',
  openingBalanceCents: 300000,
  isActive: true,
};

const withBalance = (account: Account) => ({
  ...account,
  balanceCents: account.openingBalanceCents,
});

let accounts: InMemoryAccountRepository;

beforeEach(() => {
  accounts = new InMemoryAccountRepository(
    [currentAccount, cashRegister, otherAssociationAccount],
    [currentAccount.id],
  );
});

describe('ListAccounts', () => {
  it("lists only the association's accounts, cash first, with balance equal to the opening balance", async () => {
    const listed = await new ListAccounts(accounts).execute(associationId);

    expect(listed).toEqual([withBalance(cashRegister), withBalance(currentAccount)]);
  });
});

describe('CreateAccount', () => {
  let createAccount: CreateAccount;

  beforeEach(() => {
    createAccount = new CreateAccount(accounts);
  });

  it('creates a cash account', async () => {
    const created = await createAccount.execute(associationId, {
      name: 'Caisse du brunch',
      type: 'CASH',
      openingBalanceCents: 5000,
    });

    expect(created).toEqual({
      id: created.id,
      associationId,
      name: 'Caisse du brunch',
      type: 'CASH',
      openingBalanceCents: 5000,
      isActive: true,
      balanceCents: 5000,
    });
    expect(await accounts.findAll(associationId)).toContainEqual(created);
  });

  it('creates a bank account with a negative opening balance', async () => {
    const created = await createAccount.execute(associationId, {
      name: 'Compte du camp',
      type: 'BANK',
      openingBalanceCents: -4560,
    });

    expect(created.balanceCents).toBe(-4560);
  });

  it('refuses a negative opening balance on a cash account', async () => {
    await expect(
      createAccount.execute(associationId, {
        name: 'Caisse vide',
        type: 'CASH',
        openingBalanceCents: -2000,
      }),
    ).rejects.toBeInstanceOf(NegativeCashBalanceError);
  });

  it('refuses a second account with the same name, ignoring case', async () => {
    await expect(
      createAccount.execute(associationId, {
        name: 'caisse du bar',
        type: 'CASH',
        openingBalanceCents: 0,
      }),
    ).rejects.toBeInstanceOf(AccountNameAlreadyUsedError);
  });

  it('accepts a name used by another association', async () => {
    const created = await createAccount.execute(associationId, {
      name: otherAssociationAccount.name,
      type: 'BANK',
      openingBalanceCents: 0,
    });

    expect(created.associationId).toBe(associationId);
  });
});

describe('UpdateAccount', () => {
  let updateAccount: UpdateAccount;

  beforeEach(() => {
    updateAccount = new UpdateAccount(accounts);
  });

  it('renames an account', async () => {
    const updated = await updateAccount.execute(associationId, cashRegister.id, {
      name: 'Caisse principale',
    });

    expect(updated).toEqual(withBalance({ ...cashRegister, name: 'Caisse principale' }));
    expect(await accounts.findById(associationId, cashRegister.id)).toEqual(updated);
  });

  it('keeps its own name with a different case', async () => {
    const updated = await updateAccount.execute(associationId, cashRegister.id, {
      name: 'CAISSE DU BAR',
    });

    expect(updated.name).toBe('CAISSE DU BAR');
  });

  it('refuses the name of another account, ignoring case', async () => {
    await expect(
      updateAccount.execute(associationId, cashRegister.id, { name: 'compte courant' }),
    ).rejects.toBeInstanceOf(AccountNameAlreadyUsedError);
  });

  it('corrects the opening balance of an account without movements', async () => {
    const updated = await updateAccount.execute(associationId, cashRegister.id, {
      openingBalanceCents: 20000,
    });

    expect(updated.balanceCents).toBe(20000);
  });

  it('refuses a negative opening balance on a cash account', async () => {
    await expect(
      updateAccount.execute(associationId, cashRegister.id, { openingBalanceCents: -100 }),
    ).rejects.toBeInstanceOf(NegativeCashBalanceError);
  });

  it('refuses to change the opening balance of an account with movements', async () => {
    await expect(
      updateAccount.execute(associationId, currentAccount.id, { openingBalanceCents: 0 }),
    ).rejects.toBeInstanceOf(AccountHasMovementsError);
  });

  it('renames an account with movements', async () => {
    const updated = await updateAccount.execute(associationId, currentAccount.id, {
      name: 'Compte BNP',
    });

    expect(updated.name).toBe('Compte BNP');
  });

  it('keeps an account unchanged when no change is given', async () => {
    const updated = await updateAccount.execute(associationId, currentAccount.id, {});

    expect(updated).toEqual(withBalance(currentAccount));
  });

  it('refuses to update an account of another association', async () => {
    await expect(
      updateAccount.execute(associationId, otherAssociationAccount.id, { name: 'Volé' }),
    ).rejects.toBeInstanceOf(AccountNotFoundError);
  });
});

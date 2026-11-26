import type { TreasurySettings } from '@ardoise/types';
import { beforeEach, describe, expect, it } from 'vitest';
import { AccountNotFoundError, type Account } from '../domain/account.js';
import { ProjectNotFoundError, type Project } from '../domain/project.js';
import { NotACashAccountError } from '../domain/settings.js';
import { InMemoryAccountRepository } from '../infrastructure/in-memory-account.repository.js';
import { InMemoryProjectRepository } from '../infrastructure/in-memory-project.repository.js';
import { InMemorySettingsRepository } from '../infrastructure/in-memory-settings.repository.js';
import { GetSettings } from './get-settings.use-case.js';
import { UpdateSettings } from './update-settings.use-case.js';

const associationId = 'a55c1a7e-0000-4000-8000-000000000001';
const otherAssociationId = 'b0000000-0000-4000-8000-000000000002';
const unknownId = 'f0000000-0000-4000-8000-000000000099';
const categoryId = 'f1000000-0000-4000-8000-000000000001';

const weeklyEvenings: Project = {
  id: 'f2000000-0000-4000-8000-000000000001',
  associationId,
  categoryId,
  name: 'Soirées hebdo',
  isActive: true,
};

const barStock: Project = {
  id: 'f2000000-0000-4000-8000-000000000002',
  associationId,
  categoryId,
  name: 'Stock bar',
  isActive: true,
};

const foreignProject: Project = {
  id: 'f2000000-0000-4000-8000-000000000003',
  associationId: otherAssociationId,
  categoryId,
  name: 'Camp',
  isActive: true,
};

const cashRegister: Account = {
  id: 'e0000000-0000-4000-8000-000000000001',
  associationId,
  name: 'Caisse du bar',
  type: 'CASH',
  openingBalanceCents: 15000,
  isActive: true,
};

const currentAccount: Account = {
  id: 'e0000000-0000-4000-8000-000000000002',
  associationId,
  name: 'Compte courant',
  type: 'BANK',
  openingBalanceCents: 164000,
  isActive: true,
};

const foreignCashRegister: Account = {
  id: 'e0000000-0000-4000-8000-000000000003',
  associationId: otherAssociationId,
  name: 'Caisse du camp',
  type: 'CASH',
  openingBalanceCents: 0,
  isActive: true,
};

const emptyValues: TreasurySettings = {
  defaultProjectId: null,
  stockProjectId: null,
  defaultCashAccountId: null,
};

const fullValues: TreasurySettings = {
  defaultProjectId: weeklyEvenings.id,
  stockProjectId: barStock.id,
  defaultCashAccountId: cashRegister.id,
};

let settings: InMemorySettingsRepository;
let getSettings: GetSettings;
let updateSettings: UpdateSettings;

beforeEach(() => {
  settings = new InMemorySettingsRepository();
  getSettings = new GetSettings(settings);
  updateSettings = new UpdateSettings(
    settings,
    new InMemoryProjectRepository([weeklyEvenings, barStock, foreignProject]),
    new InMemoryAccountRepository([cashRegister, currentAccount, foreignCashRegister]),
  );
});

describe('GetSettings', () => {
  it('returns empty settings when nothing was saved', async () => {
    expect(await getSettings.execute(associationId)).toEqual({ associationId, ...emptyValues });
  });
});

describe('UpdateSettings', () => {
  it('saves the three choices', async () => {
    const saved = await updateSettings.execute(associationId, fullValues);

    expect(saved).toEqual({ associationId, ...fullValues });
    expect(await getSettings.execute(associationId)).toEqual(saved);
  });

  it('accepts the same project in both roles', async () => {
    const values = { ...emptyValues, defaultProjectId: barStock.id, stockProjectId: barStock.id };

    expect(await updateSettings.execute(associationId, values)).toEqual({
      associationId,
      ...values,
    });
  });

  it('clears a choice set back to null', async () => {
    await updateSettings.execute(associationId, fullValues);

    await updateSettings.execute(associationId, { ...fullValues, stockProjectId: null });

    expect((await getSettings.execute(associationId)).stockProjectId).toBeNull();
  });

  it('rejects an unknown default project', async () => {
    await expect(
      updateSettings.execute(associationId, { ...emptyValues, defaultProjectId: unknownId }),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
    expect(await getSettings.execute(associationId)).toEqual({ associationId, ...emptyValues });
  });

  it('rejects a stock project of another association', async () => {
    await expect(
      updateSettings.execute(associationId, { ...emptyValues, stockProjectId: foreignProject.id }),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it('rejects an account of another association', async () => {
    await expect(
      updateSettings.execute(associationId, {
        ...emptyValues,
        defaultCashAccountId: foreignCashRegister.id,
      }),
    ).rejects.toBeInstanceOf(AccountNotFoundError);
  });

  it('rejects a bank account as default cash account', async () => {
    await expect(
      updateSettings.execute(associationId, {
        ...emptyValues,
        defaultCashAccountId: currentAccount.id,
      }),
    ).rejects.toBeInstanceOf(NotACashAccountError);
  });
});

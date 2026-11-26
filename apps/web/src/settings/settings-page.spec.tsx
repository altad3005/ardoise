import {
  treasurySettingsSchema,
  type TreasuryAccount,
  type TreasuryProject,
  type TreasurySettings,
} from '@ardoise/types';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithQueryClient, stubFetch } from '../test-utils.tsx';
import { SettingsPage } from './settings-page.tsx';

const categoryId = 'f1000000-0000-4000-8000-000000000001';
const weeklyEvenings: TreasuryProject = {
  id: 'f2000000-0000-4000-8000-000000000001',
  name: 'Soirées hebdo',
  categoryId,
};
const barStock: TreasuryProject = {
  id: 'f2000000-0000-4000-8000-000000000002',
  name: 'Stock bar',
  categoryId,
};
const cashRegister: TreasuryAccount = {
  id: 'e0000000-0000-4000-8000-000000000001',
  name: 'Caisse du bar',
  type: 'CASH',
  openingBalanceCents: 15000,
  balanceCents: 15000,
};
const currentAccount: TreasuryAccount = {
  id: 'e0000000-0000-4000-8000-000000000002',
  name: 'Compte courant',
  type: 'BANK',
  openingBalanceCents: 164000,
  balanceCents: 164000,
};

const savedSettings: TreasurySettings = {
  defaultProjectId: weeklyEvenings.id,
  stockProjectId: barStock.id,
  defaultCashAccountId: cashRegister.id,
};

function parseBody(body: BodyInit | null | undefined): unknown {
  return typeof body === 'string' ? JSON.parse(body) : null;
}

function stubSettingsApi({
  settings = savedSettings,
  projects = [weeklyEvenings, barStock],
  accounts = [cashRegister, currentAccount],
  saveStatus = 200,
}: {
  settings?: TreasurySettings;
  projects?: TreasuryProject[];
  accounts?: TreasuryAccount[];
  saveStatus?: number;
} = {}) {
  return stubFetch((url, init) => {
    if (url.endsWith('/treasury-settings') && init?.method === 'PUT') {
      return jsonResponse(parseBody(init.body), saveStatus);
    }
    if (url.endsWith('/treasury-settings')) {
      return jsonResponse(settings);
    }
    if (url.endsWith('/accounts')) {
      return jsonResponse(accounts);
    }
    return jsonResponse(projects);
  });
}

function sentSettings(fetchMock: ReturnType<typeof stubSettingsApi>): TreasurySettings {
  const call = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT');
  return treasurySettingsSchema.parse(parseBody(call?.[1]?.body));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SettingsPage', () => {
  it('preselects the saved choices', async () => {
    stubSettingsApi();
    renderWithQueryClient(<SettingsPage />);

    expect(await screen.findByLabelText('Projet par défaut des soirées')).toHaveValue(
      weeklyEvenings.id,
    );
    expect(screen.getByLabelText('Projet stock')).toHaveValue(barStock.id);
    expect(screen.getByLabelText('Compte caisse par défaut')).toHaveValue(cashRegister.id);
  });

  it('offers only cash accounts as default cash account', async () => {
    stubSettingsApi();
    renderWithQueryClient(<SettingsPage />);

    const cashSelect = await screen.findByLabelText('Compte caisse par défaut');
    expect(
      within(cashSelect)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Aucun', 'Caisse du bar']);
  });

  it('saves the chosen settings', async () => {
    const fetchMock = stubSettingsApi({
      settings: { defaultProjectId: null, stockProjectId: null, defaultCashAccountId: null },
    });
    renderWithQueryClient(<SettingsPage />);
    const user = userEvent.setup();

    await user.selectOptions(
      await screen.findByLabelText('Projet par défaut des soirées'),
      'Soirées hebdo',
    );
    await user.selectOptions(screen.getByLabelText('Projet stock'), 'Stock bar');
    await user.selectOptions(screen.getByLabelText('Compte caisse par défaut'), 'Caisse du bar');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Paramétrage enregistré')).toBeInTheDocument();
    expect(sentSettings(fetchMock)).toEqual(savedSettings);
  });

  it('sends null for a choice set back to Aucun', async () => {
    const fetchMock = stubSettingsApi();
    renderWithQueryClient(<SettingsPage />);
    const user = userEvent.setup();

    await user.selectOptions(await screen.findByLabelText('Projet stock'), 'Aucun');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await screen.findByText('Paramétrage enregistré');
    expect(sentSettings(fetchMock)).toEqual({ ...savedSettings, stockProjectId: null });
  });

  it('explains what to create first when there is no project nor cash account', async () => {
    stubSettingsApi({
      settings: { defaultProjectId: null, stockProjectId: null, defaultCashAccountId: null },
      projects: [],
      accounts: [currentAccount],
    });
    renderWithQueryClient(<SettingsPage />);

    expect(
      await screen.findByText(
        'Créez d’abord vos projets et votre compte caisse dans les pages Projets et Comptes.',
      ),
    ).toBeInTheDocument();
  });

  it('shows an error when saving fails', async () => {
    stubSettingsApi({ saveStatus: 500 });
    renderWithQueryClient(<SettingsPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Enregistrer' }));

    expect(
      await screen.findByText('Une erreur est survenue, réessayez plus tard'),
    ).toBeInTheDocument();
  });
});

import type { TreasuryAccount } from '@ardoise/types';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithQueryClient, stubFetch } from '../test-utils.tsx';
import { AccountsPage } from './accounts-page.tsx';

const cashRegister: TreasuryAccount = {
  id: 'e0000000-0000-4000-8000-000000000002',
  name: 'Caisse du bar',
  type: 'CASH',
  openingBalanceCents: 15000,
  balanceCents: 37620,
};

const campAccount: TreasuryAccount = {
  id: 'e0000000-0000-4000-8000-000000000004',
  name: 'Compte du camp',
  type: 'BANK',
  openingBalanceCents: -4560,
  balanceCents: -4560,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AccountsPage', () => {
  it('lists accounts with their balance', async () => {
    stubFetch(() => jsonResponse([cashRegister, campAccount]));
    renderWithQueryClient(<AccountsPage />);

    const cash = await screen.findByRole('article', { name: 'Caisse du bar' });
    expect(within(cash).getByText('Caisse espèces')).toBeInTheDocument();
    expect(within(cash).getByText('376,20 €')).toBeInTheDocument();
    expect(within(cash).getByText('ouvert à 150,00 €')).toBeInTheDocument();
    const camp = screen.getByRole('article', { name: 'Compte du camp' });
    expect(within(camp).getByText('Banque')).toBeInTheDocument();
    expect(within(camp).getByText('-45,60 €')).toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    stubFetch(() => jsonResponse([]));
    renderWithQueryClient(<AccountsPage />);

    expect(
      await screen.findByText(
        'Aucun compte. Déclare au moins une caisse pour pouvoir ouvrir une soirée.',
      ),
    ).toBeInTheDocument();
  });

  it('fills the form when editing an account', async () => {
    stubFetch(() => jsonResponse([cashRegister]));
    renderWithQueryClient(<AccountsPage />);
    const user = userEvent.setup();

    const cash = await screen.findByRole('article', { name: 'Caisse du bar' });
    await user.click(within(cash).getByRole('button', { name: 'Modifier' }));

    expect(screen.getByRole('heading', { name: 'Modifier Caisse du bar' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nom')).toHaveValue('Caisse du bar');
    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.getByRole('heading', { name: 'Nouveau compte' })).toBeInTheDocument();
  });
});

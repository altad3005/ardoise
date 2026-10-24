import type { TreasuryAccount } from '@ardoise/types';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithQueryClient, stubFetch } from '../test-utils.tsx';
import { AccountForm } from './account-form.tsx';

const cashRegister: TreasuryAccount = {
  id: 'e0000000-0000-4000-8000-000000000002',
  name: 'Caisse du bar',
  type: 'CASH',
  openingBalanceCents: 15000,
  balanceCents: 15000,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

async function fill(name: string, openingBalance: string) {
  const user = userEvent.setup();
  await user.clear(screen.getByLabelText('Nom'));
  await user.type(screen.getByLabelText('Nom'), name);
  await user.clear(screen.getByLabelText("Solde d'ouverture (€)"));
  await user.type(screen.getByLabelText("Solde d'ouverture (€)"), openingBalance);
  return user;
}

describe('AccountForm', () => {
  it('creates a cash account', async () => {
    const fetchMock = stubFetch(() => jsonResponse(cashRegister, 201));
    const onDone = vi.fn<() => void>();
    renderWithQueryClient(<AccountForm onDone={onDone} />);

    const user = await fill('Caisse du bar', '150');
    await user.click(screen.getByRole('button', { name: 'Créer le compte' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/management/accounts',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Caisse du bar', type: 'CASH', openingBalanceCents: 15000 }),
      }),
    );
  });

  it('creates an overdrawn bank account', async () => {
    const fetchMock = stubFetch(() =>
      jsonResponse({ ...cashRegister, type: 'BANK', openingBalanceCents: -4560 }, 201),
    );
    renderWithQueryClient(<AccountForm onDone={() => {}} />);

    const user = await fill('Compte du camp', '-45,60');
    await user.click(screen.getByRole('radio', { name: 'Banque' }));
    await user.click(screen.getByRole('button', { name: 'Créer le compte' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/management/accounts',
        expect.objectContaining({
          body: JSON.stringify({
            name: 'Compte du camp',
            type: 'BANK',
            openingBalanceCents: -4560,
          }),
        }),
      ),
    );
  });

  it('refuses a negative cash balance without calling the API', async () => {
    const fetchMock = stubFetch(() => jsonResponse(cashRegister, 201));
    renderWithQueryClient(<AccountForm onDone={() => {}} />);

    const user = await fill('Caisse vide', '-20');
    await user.click(screen.getByRole('button', { name: 'Créer le compte' }));

    expect(
      await screen.findByText('Une caisse ne peut pas démarrer avec un solde négatif'),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('asks for a valid amount', async () => {
    stubFetch(() => jsonResponse(cashRegister, 201));
    renderWithQueryClient(<AccountForm onDone={() => {}} />);

    const user = await fill('Caisse', 'beaucoup');
    await user.click(screen.getByRole('button', { name: 'Créer le compte' }));

    expect(await screen.findByText('Saisis un montant, par exemple 150,00')).toBeInTheDocument();
  });

  it('shows the name conflict', async () => {
    stubFetch(() => jsonResponse({ message: 'An account already uses this name' }, 409));
    renderWithQueryClient(<AccountForm onDone={() => {}} />);

    const user = await fill('Caisse du bar', '0');
    await user.click(screen.getByRole('button', { name: 'Créer le compte' }));

    expect(await screen.findByText('Ce nom est déjà utilisé')).toBeInTheDocument();
  });

  it('edits an account with a PATCH of the changed fields', async () => {
    const fetchMock = stubFetch(() =>
      jsonResponse({ ...cashRegister, name: 'Caisse principale', openingBalanceCents: 20000 }),
    );
    const onDone = vi.fn<() => void>();
    renderWithQueryClient(<AccountForm account={cashRegister} onDone={onDone} />);

    expect(screen.getByLabelText('Nom')).toHaveValue('Caisse du bar');
    expect(screen.getByLabelText("Solde d'ouverture (€)")).toHaveValue('150,00');
    expect(screen.getByRole('radio', { name: 'Caisse espèces' })).toBeDisabled();
    const user = await fill('Caisse principale', '200');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/management/accounts/${cashRegister.id}`,
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'Caisse principale', openingBalanceCents: 20000 }),
      }),
    );
  });

  it('shows the movements conflict on edit', async () => {
    stubFetch(() => jsonResponse({ message: 'The account already has movements' }, 422));
    renderWithQueryClient(<AccountForm account={cashRegister} onDone={() => {}} />);

    const user = await fill('Caisse du bar', '200');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(
      await screen.findByText(
        "Ce compte a déjà des mouvements : son solde d'ouverture ne peut plus changer",
      ),
    ).toBeInTheDocument();
  });
});

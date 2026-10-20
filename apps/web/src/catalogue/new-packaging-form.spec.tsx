import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithQueryClient, stubFetch } from '../test-utils.tsx';
import { NewPackagingForm } from './new-packaging-form.tsx';

const productId = 'c0000000-0000-4000-8000-000000000001';

afterEach(() => {
  vi.unstubAllGlobals();
});

async function fillAndSubmit(label: string, unitCount: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Libellé'), label);
  await user.type(screen.getByLabelText("Nombre d'unités"), unitCount);
  await user.click(screen.getByRole('button', { name: 'Ajouter' }));
}

describe('NewPackagingForm', () => {
  it('creates the packaging then closes', async () => {
    const fetchMock = stubFetch(() =>
      jsonResponse(
        {
          id: 'd0000000-0000-4000-8000-000000000042',
          label: 'pack de 12',
          unitCount: 12,
          isShared: false,
        },
        201,
      ),
    );
    const onClose = vi.fn<() => void>();
    renderWithQueryClient(<NewPackagingForm productId={productId} onClose={onClose} />);

    await fillAndSubmit('pack de 12', '12');

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/management/products/${productId}/packagings`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ label: 'pack de 12', unitCount: 12 }),
      }),
    );
  });

  it('accepts a decimal comma', async () => {
    const fetchMock = stubFetch(() =>
      jsonResponse(
        {
          id: 'd0000000-0000-4000-8000-000000000042',
          label: 'demi-bac',
          unitCount: 0.5,
          isShared: false,
        },
        201,
      ),
    );
    renderWithQueryClient(<NewPackagingForm productId={productId} onClose={() => {}} />);

    await fillAndSubmit('demi-bac', '0,5');

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ body: JSON.stringify({ label: 'demi-bac', unitCount: 0.5 }) }),
      ),
    );
  });

  it('rejects a unit count that is not positive, without calling the API', async () => {
    const fetchMock = stubFetch(() => jsonResponse({}, 500));
    renderWithQueryClient(<NewPackagingForm productId={productId} onClose={() => {}} />);

    await fillAndSubmit('vide', '0');

    expect(screen.getByLabelText("Nombre d'unités")).toHaveAccessibleDescription(
      "Le nombre d'unités doit être un nombre positif",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('explains that the label is already used', async () => {
    stubFetch(() => jsonResponse({}, 409));
    renderWithQueryClient(<NewPackagingForm productId={productId} onClose={() => {}} />);

    await fillAndSubmit('bac de 24', '24');

    await waitFor(() =>
      expect(screen.getByLabelText('Libellé')).toHaveAccessibleDescription(
        'Un conditionnement porte déjà ce libellé',
      ),
    );
  });
});

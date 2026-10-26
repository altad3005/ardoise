import type { ProjectCategory, TreasuryProject } from '@ardoise/types';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithQueryClient, stubFetch } from '../test-utils.tsx';
import { ProjectForm } from './project-form.tsx';

const bar: ProjectCategory = { id: 'f1000000-0000-4000-8000-000000000001', name: 'Bar' };
const financing: ProjectCategory = {
  id: 'f1000000-0000-4000-8000-000000000002',
  name: 'Financement',
};
const categories = [bar, financing];

const brunch: TreasuryProject = {
  id: 'f2000000-0000-4000-8000-000000000003',
  name: 'Brunch #1',
  categoryId: financing.id,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ProjectForm', () => {
  it('creates a project in the chosen category', async () => {
    const fetchMock = stubFetch(() =>
      jsonResponse(
        { id: 'f2000000-0000-4000-8000-000000000042', name: 'Brunch #2', categoryId: financing.id },
        201,
      ),
    );
    const onDone = vi.fn<() => void>();
    renderWithQueryClient(<ProjectForm categories={categories} onDone={onDone} />);
    const user = userEvent.setup();

    expect(screen.getByLabelText('Catégorie')).toHaveValue(bar.id);
    await user.type(screen.getByLabelText('Nom'), 'Brunch #2');
    await user.selectOptions(screen.getByLabelText('Catégorie'), financing.id);
    await user.click(screen.getByRole('button', { name: 'Créer le projet' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/management/projects',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Brunch #2', categoryId: financing.id }),
      }),
    );
  });

  it('moves a project to another category', async () => {
    const fetchMock = stubFetch(() => jsonResponse({ ...brunch, categoryId: bar.id }));
    const onDone = vi.fn<() => void>();
    renderWithQueryClient(<ProjectForm project={brunch} categories={categories} onDone={onDone} />);
    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText('Catégorie'), bar.id);
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/management/projects/${brunch.id}`,
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ categoryId: bar.id }) }),
    );
  });

  it('closes without a request when nothing changed', async () => {
    const fetchMock = stubFetch(() => jsonResponse(brunch));
    const onDone = vi.fn<() => void>();
    renderWithQueryClient(<ProjectForm project={brunch} categories={categories} onDone={onDone} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(onDone).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the name conflict', async () => {
    stubFetch(() => jsonResponse({ message: 'A project already uses this name' }, 409));
    renderWithQueryClient(<ProjectForm categories={categories} onDone={() => {}} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Nom'), 'Bar');
    await user.click(screen.getByRole('button', { name: 'Créer le projet' }));

    expect(await screen.findByText('Ce nom est déjà utilisé')).toBeInTheDocument();
  });
});

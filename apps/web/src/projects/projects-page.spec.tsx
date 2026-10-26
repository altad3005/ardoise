import type { ProjectCategory, TreasuryProject } from '@ardoise/types';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithQueryClient, stubFetch } from '../test-utils.tsx';
import { ProjectsPage } from './projects-page.tsx';

const bar: ProjectCategory = { id: 'f1000000-0000-4000-8000-000000000001', name: 'Bar' };
const financing: ProjectCategory = {
  id: 'f1000000-0000-4000-8000-000000000002',
  name: 'Financement',
};
const weekend: ProjectCategory = { id: 'f1000000-0000-4000-8000-000000000003', name: 'WE Section' };

const projects: TreasuryProject[] = [
  { id: 'f2000000-0000-4000-8000-000000000001', name: 'Bar', categoryId: bar.id },
  { id: 'f2000000-0000-4000-8000-000000000002', name: 'Bar / Stock', categoryId: bar.id },
  { id: 'f2000000-0000-4000-8000-000000000003', name: 'Brunch #1', categoryId: financing.id },
];

function stubProjectsApi(initialCategories: ProjectCategory[]) {
  let categories = initialCategories;
  return stubFetch((url, init) => {
    if (url.endsWith('/project-categories') && init?.method === 'POST') {
      const created = {
        id: 'f1000000-0000-4000-8000-000000000042',
        ...JSON.parse(init.body as string),
      };
      categories = [...categories, created];
      return jsonResponse(created, 201);
    }
    if (url.includes('/project-categories/') && init?.method === 'PATCH') {
      const id = url.split('/').at(-1);
      const { name } = JSON.parse(init.body as string) as { name: string };
      categories = categories.map((category) =>
        category.id === id ? { ...category, name } : category,
      );
      return jsonResponse(categories.find((category) => category.id === id));
    }
    if (url.endsWith('/project-categories')) {
      return jsonResponse(categories);
    }
    return jsonResponse(projects);
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ProjectsPage', () => {
  it('groups projects by category with their count', async () => {
    stubProjectsApi([bar, financing, weekend]);
    renderWithQueryClient(<ProjectsPage />);

    const barFolder = await screen.findByRole('region', { name: 'Bar' });
    expect(within(barFolder).getByText('· 2 projets')).toBeInTheDocument();
    expect(
      within(barFolder)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([expect.stringContaining('Bar'), expect.stringContaining('Bar / Stock')]);
    const financingFolder = screen.getByRole('region', { name: 'Financement' });
    expect(within(financingFolder).getByText('· 1 projet')).toBeInTheDocument();
    const weekendFolder = screen.getByRole('region', { name: 'WE Section' });
    expect(
      within(weekendFolder).getByText('Aucun projet dans cette catégorie'),
    ).toBeInTheDocument();
  });

  it('opens the category form right away when there is no category', async () => {
    stubProjectsApi([]);
    renderWithQueryClient(<ProjectsPage />);

    expect(
      await screen.findByText(
        'Commencez par créer une catégorie, par exemple Bar, Camp ou Financement. Chaque projet appartient à une catégorie.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Nom')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Annuler' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nouveau projet' })).toBeDisabled();
  });

  it('creates a category from the header', async () => {
    const fetchMock = stubProjectsApi([bar]);
    renderWithQueryClient(<ProjectsPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Nouvelle catégorie' }));
    await user.type(screen.getByLabelText('Nom'), 'Camp');
    await user.click(screen.getByRole('button', { name: 'Créer la catégorie' }));

    expect(await screen.findByRole('region', { name: 'Camp' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/management/project-categories',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'Camp' }) }),
    );
  });

  it('renames a category and shows the new name', async () => {
    const fetchMock = stubProjectsApi([bar, financing]);
    renderWithQueryClient(<ProjectsPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Renommer la catégorie Bar' }));
    const name = screen.getByLabelText('Nom');
    await user.clear(name);
    await user.type(name, 'Bar et soirées');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByRole('region', { name: 'Bar et soirées' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/management/project-categories/${bar.id}`,
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'Bar et soirées' }),
      }),
    );
  });

  it("opens a project's edit form from its edit button", async () => {
    stubProjectsApi([bar, financing]);
    renderWithQueryClient(<ProjectsPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Modifier Brunch #1' }));

    expect(screen.getByLabelText('Nom')).toHaveValue('Brunch #1');
    expect(screen.getByLabelText('Catégorie')).toHaveValue(financing.id);
    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    await waitFor(() => expect(screen.queryByLabelText('Nom')).not.toBeInTheDocument());
  });
});

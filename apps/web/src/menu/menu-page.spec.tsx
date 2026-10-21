import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithQueryClient, stubFetch } from '../test-utils.tsx';
import { MenuPage } from './menu-page.tsx';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Menu page', () => {
  it('presents the default menu offered when an evening opens', async () => {
    stubFetch(() => jsonResponse([]));
    renderWithQueryClient(<MenuPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Carte de la caisse' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/proposée à l'ouverture de chaque soirée/)).toBeInTheDocument();
    expect(await screen.findByText('Aucun article sur la carte')).toBeInTheDocument();
  });
});

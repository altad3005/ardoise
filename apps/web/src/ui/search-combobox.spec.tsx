import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchCombobox, type SearchOption } from './search-combobox.tsx';

const options: SearchOption[] = [
  { id: 'entry', label: 'Entrée soirée', detail: '5,00 €' },
  { id: 'brunch', label: 'Ticket brunch' },
  { id: 'beer', label: 'Jupiler 25 cl' },
];

function renderCombobox() {
  const onSelect = vi.fn<(optionId: string) => void>();
  render(
    <SearchCombobox
      id="search"
      label="Ajouter un article"
      placeholder="Rechercher un article…"
      options={options}
      onSelect={onSelect}
    />,
  );
  return { input: screen.getByRole('combobox', { name: 'Ajouter un article' }), onSelect };
}

const suggestions = () => screen.queryAllByRole('option').map((option) => option.textContent);

describe('SearchCombobox', () => {
  it('suggests nothing before typing', async () => {
    const { input } = renderCombobox();

    await userEvent.click(input);

    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('suggests the options containing the typed letters, ignoring case and accents', async () => {
    const { input } = renderCombobox();

    await userEvent.type(input, 'ENTREE');

    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(suggestions()).toEqual(['Entrée soirée5,00 €']);
  });

  it('matches letters anywhere in the label', async () => {
    const { input } = renderCombobox();

    await userEvent.type(input, 'br');

    expect(suggestions()).toEqual(['Ticket brunch']);
  });

  it('says when nothing matches', async () => {
    const { input } = renderCombobox();

    await userEvent.type(input, 'vodka');

    expect(suggestions()).toEqual([]);
    expect(screen.getByText('Aucun résultat')).toBeInTheDocument();
  });

  it('selects a suggestion with a click, then clears the search', async () => {
    const { input, onSelect } = renderCombobox();

    await userEvent.type(input, 'ticket');
    await userEvent.click(screen.getByRole('option', { name: 'Ticket brunch' }));

    expect(onSelect).toHaveBeenCalledWith('brunch');
    expect(input).toHaveValue('');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('browses the suggestions with the arrow keys and selects with Enter', async () => {
    const { input, onSelect } = renderCombobox();

    await userEvent.type(input, 'e');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');

    const active = screen.getByRole('option', { selected: true });
    expect(input).toHaveAttribute('aria-activedescendant', active.id);
    expect(active).toHaveTextContent('Ticket brunch');

    await userEvent.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledWith('brunch');
  });

  it('wraps around from the first suggestion to the last', async () => {
    const { input } = renderCombobox();

    await userEvent.type(input, 'e');
    await userEvent.keyboard('{ArrowUp}');

    expect(screen.getByRole('option', { selected: true })).toHaveTextContent('Jupiler 25 cl');
  });

  it('ignores Enter while no suggestion is highlighted', async () => {
    const { input, onSelect } = renderCombobox();

    await userEvent.type(input, 'e{Enter}');

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('closes the suggestions with Escape', async () => {
    const { input } = renderCombobox();

    await userEvent.type(input, 'e{Escape}');

    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveValue('e');
  });
});

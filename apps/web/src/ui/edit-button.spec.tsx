import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EditButton } from './edit-button.tsx';

describe('EditButton', () => {
  it('shows "Modifier" and names the edited item for screen readers', () => {
    render(<EditButton itemName="Caisse du bar" />);

    const button = screen.getByRole('button', { name: 'Modifier Caisse du bar' });
    expect(button).toHaveTextContent('Modifier');
  });

  it('calls onClick and tells whether its panel is open', async () => {
    const onClick = vi.fn<() => void>();
    render(<EditButton itemName="Caisse du bar" aria-expanded onClick={onClick} />);

    const button = screen.getByRole('button', { name: 'Modifier Caisse du bar' });
    await userEvent.setup().click(button);

    expect(onClick).toHaveBeenCalledOnce();
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });
});

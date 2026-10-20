import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './button.tsx';

describe('Button', () => {
  it('calls onClick when clicked', async () => {
    const onClick = vi.fn<() => void>();
    render(<Button onClick={onClick}>Enregistrer</Button>);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn<() => void>();
    render(
      <Button onClick={onClick} disabled>
        Enregistrer
      </Button>,
    );
    await userEvent.setup().click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not call onClick and is busy while pending', async () => {
    const onClick = vi.fn<() => void>();
    render(
      <Button onClick={onClick} isPending>
        Enregistrer
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Enregistrer' });
    await userEvent.setup().click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('defaults to type button', () => {
    render(<Button>Enregistrer</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('keeps an explicit submit type', () => {
    render(<Button type="submit">Enregistrer</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});

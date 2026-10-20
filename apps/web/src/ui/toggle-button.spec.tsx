import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ToggleButton } from './toggle-button.tsx';

describe('ToggleButton', () => {
  it('is pressed when selected', () => {
    render(<ToggleButton isSelected>Actifs</ToggleButton>);
    expect(screen.getByRole('button', { name: 'Actifs' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('is not pressed when not selected', () => {
    render(<ToggleButton isSelected={false}>Actifs</ToggleButton>);
    expect(screen.getByRole('button', { name: 'Actifs' })).toHaveAttribute('aria-pressed', 'false');
  });
});

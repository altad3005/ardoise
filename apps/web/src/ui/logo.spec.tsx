import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo } from './logo.tsx';

describe('Logo', () => {
  it('is announced as the Ardoise image', () => {
    render(<Logo />);
    expect(screen.getByRole('img', { name: 'Ardoise' })).toBeInTheDocument();
  });
});

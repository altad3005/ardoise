import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Alert } from './alert.tsx';

describe('Alert', () => {
  it('is announced as an alert', () => {
    render(<Alert>Une erreur est survenue</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Une erreur est survenue');
  });
});

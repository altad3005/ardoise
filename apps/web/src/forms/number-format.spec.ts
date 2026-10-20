import { describe, expect, it } from 'vitest';
import { formatPrice, formatQuantity } from './number-format.ts';

describe('formatPrice', () => {
  it('shows cents as euros', () => {
    expect(formatPrice(2800)).toBe('28,00\u00a0€');
  });
});

describe('formatQuantity', () => {
  it('shows up to 4 decimals with a comma', () => {
    expect(formatQuantity(0.05)).toBe('0,05');
    expect(formatQuantity(24)).toBe('24');
    expect(formatQuantity(0.3333)).toBe('0,3333');
  });
});

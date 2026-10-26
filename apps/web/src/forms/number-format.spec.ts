import { describe, expect, it } from 'vitest';
import { formatPrice, formatQuantity, formatStockQuantity } from './number-format.ts';

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

describe('formatStockQuantity', () => {
  it('puts the stock unit in the plural from two units', () => {
    expect(formatStockQuantity(24, 'bouteille')).toBe('24 bouteilles');
    expect(formatStockQuantity(2, 'fût')).toBe('2 fûts');
  });

  it('keeps the stock unit singular below two units', () => {
    expect(formatStockQuantity(1, 'bouteille')).toBe('1 bouteille');
    expect(formatStockQuantity(1.5, 'bouteille')).toBe('1,5 bouteille');
  });

  it('does not add an s to a unit already ending with s or x', () => {
    expect(formatStockQuantity(6, 'pièces')).toBe('6 pièces');
    expect(formatStockQuantity(3, 'choux')).toBe('3 choux');
  });
});

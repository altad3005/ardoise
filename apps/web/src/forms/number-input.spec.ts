import { describe, expect, it } from 'vitest';
import { parseDecimal, parsePriceInCents, parseQuantity } from './number-input.ts';

describe('parseDecimal', () => {
  it('reads a decimal comma or point', () => {
    expect(parseDecimal('0,5')).toBe(0.5);
    expect(parseDecimal(' 24 ')).toBe(24);
    expect(parseDecimal('1.25')).toBe(1.25);
  });

  it('is not a number when empty or invalid', () => {
    expect(parseDecimal('')).toBeNaN();
    expect(parseDecimal('douze')).toBeNaN();
  });
});

describe('parseQuantity', () => {
  it('reads a fraction, rounded to 4 decimals', () => {
    expect(parseQuantity('1/20')).toBe(0.05);
    expect(parseQuantity('1 / 3')).toBe(0.3333);
  });

  it('reads a decimal', () => {
    expect(parseQuantity('0,05')).toBe(0.05);
  });

  it('is not a number when dividing by zero', () => {
    expect(parseQuantity('1/0')).toBeNaN();
  });
});

describe('parsePriceInCents', () => {
  it('reads euros as cents', () => {
    expect(parsePriceInCents('2')).toBe(200);
    expect(parsePriceInCents('2,5')).toBe(250);
    expect(parsePriceInCents('28,00 €')).toBe(2800);
    expect(parsePriceInCents('0.10')).toBe(10);
  });

  it('is not a number beyond the cent or when invalid', () => {
    expect(parsePriceInCents('2,005')).toBeNaN();
    expect(parsePriceInCents('-2')).toBeNaN();
    expect(parsePriceInCents('')).toBeNaN();
  });
});

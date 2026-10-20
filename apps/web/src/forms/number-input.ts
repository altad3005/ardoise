const fractionPattern = /^(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)$/;
const pricePattern = /^(\d+)(?:[.,](\d{1,2}))?\s*€?$/;

export function parseDecimal(value: string): number {
  const trimmed = value.trim();
  return trimmed === '' ? Number.NaN : Number(trimmed.replace(',', '.'));
}

export function parseQuantity(value: string): number {
  const fraction = fractionPattern.exec(value.trim());
  if (!fraction) {
    return parseDecimal(value);
  }
  const quotient = parseDecimal(fraction[1]!) / parseDecimal(fraction[2]!);
  return Number.isFinite(quotient) ? Math.round(quotient * 10000) / 10000 : Number.NaN;
}

export function parsePriceInCents(value: string): number {
  const price = pricePattern.exec(value.trim());
  if (!price) {
    return Number.NaN;
  }
  return Number(price[1]) * 100 + Number((price[2] ?? '').padEnd(2, '0'));
}

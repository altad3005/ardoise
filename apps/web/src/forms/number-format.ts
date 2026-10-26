const priceFormat = new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' });
const quantityFormat = new Intl.NumberFormat('fr-BE', { maximumFractionDigits: 4 });

export function formatPrice(cents: number): string {
  return priceFormat.format(cents / 100);
}

export function formatQuantity(quantity: number): string {
  return quantityFormat.format(quantity);
}

export function formatStockQuantity(quantity: number, stockUnit: string): string {
  const isPlural = quantity >= 2 && !/[sx]$/.test(stockUnit);
  return `${formatQuantity(quantity)} ${isPlural ? `${stockUnit}s` : stockUnit}`;
}

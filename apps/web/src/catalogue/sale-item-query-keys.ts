export const productSaleItemsQueryKey = (productId: string) => [
  'products',
  productId,
  'sale-items',
];

export const stocklessSaleItemsQueryKey = ['stockless-sale-items'];

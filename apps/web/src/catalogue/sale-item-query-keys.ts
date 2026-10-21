export const saleItemsQueryKey = ['sale-items'];

export const allSaleItemsQueryKey = [...saleItemsQueryKey, 'all'];

export const productSaleItemsQueryKey = (productId: string) => [
  ...saleItemsQueryKey,
  'product',
  productId,
];

export const stocklessSaleItemsQueryKey = [...saleItemsQueryKey, 'stockless'];

export const menuQueryKey = [...saleItemsQueryKey, 'menu'];

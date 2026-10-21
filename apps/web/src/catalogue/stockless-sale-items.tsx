import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchStocklessSaleItems, updateSaleItem } from '../api/sale-items.ts';
import { Alert } from '../ui/alert.tsx';
import { SaleItemCard } from './sale-item-card.tsx';
import { saleItemsQueryKey, stocklessSaleItemsQueryKey } from './sale-item-query-keys.ts';

export function StocklessSaleItems() {
  const queryClient = useQueryClient();
  const saleItems = useQuery({
    queryKey: stocklessSaleItemsQueryKey,
    queryFn: fetchStocklessSaleItems,
  });

  if (saleItems.isError) {
    return <Alert>Une erreur est survenue, réessayez plus tard</Alert>;
  }
  if (!saleItems.isSuccess || saleItems.data.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby="stockless-sale-items" className="mb-6">
      <h2 id="stockless-sale-items" className="mb-2 font-display text-xl font-bold">
        Sans stock
      </h2>
      <ul aria-labelledby="stockless-sale-items" className="grid gap-2">
        {saleItems.data.map((saleItem) => (
          <SaleItemCard
            key={saleItem.id}
            saleItem={saleItem}
            save={async (changes) => {
              await updateSaleItem(saleItem.id, changes);
              await queryClient.invalidateQueries({ queryKey: saleItemsQueryKey });
            }}
          />
        ))}
      </ul>
    </section>
  );
}

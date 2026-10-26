import { newSaleItemSchema, type CatalogueProduct, type SaleItemChanges } from '@ardoise/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GlassWater } from 'lucide-react';
import { useState } from 'react';
import { createSaleItem, fetchProductSaleItems, updateSaleItem } from '../api/sale-items.ts';
import { Alert } from '../ui/alert.tsx';
import { Button } from '../ui/button.tsx';
import { PanelSectionHeading } from './panel-section-heading.tsx';
import { SaleItemCard } from './sale-item-card.tsx';
import { SaleItemForm } from './sale-item-form.tsx';
import { productSaleItemsQueryKey, saleItemsQueryKey } from './sale-item-query-keys.ts';

interface ProductSaleItemsProps {
  product: CatalogueProduct;
}

export function ProductSaleItems({ product }: ProductSaleItemsProps) {
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();
  const queryKey = productSaleItemsQueryKey(product.id);
  const saleItems = useQuery({ queryKey, queryFn: () => fetchProductSaleItems(product.id) });
  const headingId = `sale-items-${product.id}`;

  const refreshAfter = async (request: Promise<unknown>) => {
    await request;
    await queryClient.invalidateQueries({ queryKey: saleItemsQueryKey });
  };
  const create = (changes: SaleItemChanges) =>
    refreshAfter(createSaleItem(product.id, newSaleItemSchema.parse(changes)));

  return (
    <section aria-labelledby={headingId} className="grid gap-3 border-t border-line pt-4">
      <PanelSectionHeading
        id={headingId}
        icon={GlassWater}
        tone="accent"
        title="Vente"
        description="Ce que vous servez au bar, et à quel prix."
      />
      {saleItems.isPending && <p>Chargement…</p>}
      {saleItems.isError && <Alert>Une erreur est survenue, réessayez plus tard</Alert>}
      {saleItems.isSuccess && saleItems.data.length > 0 && (
        <ul aria-label="Articles de vente" className="grid gap-2">
          {saleItems.data.map((saleItem) => (
            <SaleItemCard
              key={saleItem.id}
              saleItem={saleItem}
              stockUnit={product.stockUnit}
              save={(changes) => refreshAfter(updateSaleItem(saleItem.id, changes))}
            />
          ))}
        </ul>
      )}
      {!product.isActive && (
        <p className="text-sm text-ink-muted">Activez le produit pour lui créer des articles</p>
      )}
      {product.isActive &&
        (isCreating ? (
          <SaleItemForm
            hasStock
            stockUnit={product.stockUnit}
            save={create}
            onDone={() => setIsCreating(false)}
          />
        ) : (
          <div>
            <Button variant="secondary" onClick={() => setIsCreating(true)}>
              + Article de vente
            </Button>
          </div>
        ))}
    </section>
  );
}

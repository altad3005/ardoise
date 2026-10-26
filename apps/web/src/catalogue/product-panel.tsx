import type { CatalogueProduct, PurchasePackaging } from '@ardoise/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { deletePackaging, fetchPackagings } from '../api/packagings.ts';
import { formatStockQuantity } from '../forms/number-format.ts';
import { Alert } from '../ui/alert.tsx';
import { Badge } from '../ui/badge.tsx';
import { Button } from '../ui/button.tsx';
import { NewPackagingForm } from './new-packaging-form.tsx';
import { packagingsQueryKey } from './packaging-query-key.ts';
import { PanelSectionHeading } from './panel-section-heading.tsx';
import { ProductSaleItems } from './product-sale-items.tsx';

const errorMessage = 'Une erreur est survenue, réessayez plus tard';

interface ProductPanelProps {
  product: CatalogueProduct;
  isDeactivating: boolean;
  onDeactivate: () => void;
}

// TODO: hide packaging and sale item editing from members without the stock manager role (Accounts and associations milestone)
export function ProductPanel({ product, isDeactivating, onDeactivate }: ProductPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const queryClient = useQueryClient();
  const queryKey = packagingsQueryKey(product.id);
  const packagings = useQuery({ queryKey, queryFn: () => fetchPackagings(product.id) });
  const deletion = useMutation({
    mutationFn: (packagingId: string) => deletePackaging(product.id, packagingId),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return (
    <div className="grid gap-4 p-4">
      <div>
        <h2 className="font-display text-xl font-bold">{product.name}</h2>
        <p className="text-sm text-ink-muted">Unité de stock : {product.stockUnit}</p>
      </div>
      <section aria-labelledby={`packagings-${product.id}`} className="grid gap-3">
        <PanelSectionHeading
          id={`packagings-${product.id}`}
          icon={ShoppingCart}
          title="Achat"
          description="Comment vous l'achetez au magasin."
        />
        {packagings.isPending && <p>Chargement…</p>}
        {packagings.isError && <Alert>{errorMessage}</Alert>}
        {packagings.isSuccess && packagings.data.length === 0 && (
          <p className="text-sm text-ink-muted">Aucun conditionnement : achat à l’unité</p>
        )}
        {packagings.isSuccess && packagings.data.length > 0 && (
          <ul aria-label="Conditionnements d'achat" className="flex flex-wrap gap-2">
            {packagings.data.map((packaging) => (
              <PackagingChip
                key={packaging.id}
                packaging={packaging}
                stockUnit={product.stockUnit}
                isLocked={deletion.isPending}
                onDelete={() => deletion.mutate(packaging.id)}
              />
            ))}
          </ul>
        )}
        {deletion.isError && <Alert>{errorMessage}</Alert>}
        {isAdding ? (
          <NewPackagingForm productId={product.id} onClose={() => setIsAdding(false)} />
        ) : (
          <div>
            <Button variant="secondary" onClick={() => setIsAdding(true)}>
              + Conditionnement d'achat
            </Button>
          </div>
        )}
      </section>
      <ProductSaleItems product={product} />
      <div className="flex justify-end border-t border-line pt-3">
        <Button variant="danger" isPending={isDeactivating} onClick={onDeactivate}>
          Désactiver ce produit
        </Button>
      </div>
    </div>
  );
}

interface PackagingChipProps {
  packaging: PurchasePackaging;
  stockUnit: string;
  isLocked: boolean;
  onDelete: () => void;
}

function PackagingChip({ packaging, stockUnit, isLocked, onDelete }: PackagingChipProps) {
  return (
    <li className="flex items-center gap-2 rounded-md bg-surface-raised py-1 pr-1 pl-3 text-sm">
      <span>
        {packaging.label} = {formatStockQuantity(packaging.unitCount, stockUnit)}
      </span>
      {packaging.isShared ? (
        <Badge>commun</Badge>
      ) : (
        <Button
          variant="ghost"
          className="min-h-8 px-2"
          disabled={isLocked}
          aria-label={`Supprimer ${packaging.label}`}
          onClick={onDelete}
        >
          ×
        </Button>
      )}
    </li>
  );
}

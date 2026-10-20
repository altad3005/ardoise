import type { CatalogueProduct, PurchasePackaging } from '@ardoise/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { deletePackaging, fetchPackagings } from '../api/packagings.ts';
import { Alert } from '../ui/alert.tsx';
import { Badge } from '../ui/badge.tsx';
import { Button } from '../ui/button.tsx';
import { NewPackagingForm } from './new-packaging-form.tsx';
import { packagingsQueryKey } from './packaging-query-key.ts';

const errorMessage = 'Une erreur est survenue, réessayez plus tard';
const unitCountFormat = new Intl.NumberFormat('fr-BE', { maximumFractionDigits: 4 });

interface ProductPanelProps {
  product: CatalogueProduct;
}

// TODO: hide packaging creation and deletion from members without the stock manager role (Accounts and associations milestone)
export function ProductPanel({ product }: ProductPanelProps) {
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
        <h3
          id={`packagings-${product.id}`}
          className="text-xs font-semibold tracking-wide text-ink-muted uppercase"
        >
          Conditionnements d'achat
        </h3>
        {packagings.isPending && <p>Chargement…</p>}
        {packagings.isError && <Alert>{errorMessage}</Alert>}
        {packagings.isSuccess && packagings.data.length === 0 && (
          <p className="text-sm text-ink-muted">Aucun conditionnement : achat à l’unité</p>
        )}
        {packagings.isSuccess && packagings.data.length > 0 && (
          <ul aria-labelledby={`packagings-${product.id}`} className="flex flex-wrap gap-2">
            {packagings.data.map((packaging) => (
              <PackagingChip
                key={packaging.id}
                packaging={packaging}
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
              + Conditionnement
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

interface PackagingChipProps {
  packaging: PurchasePackaging;
  isLocked: boolean;
  onDelete: () => void;
}

function PackagingChip({ packaging, isLocked, onDelete }: PackagingChipProps) {
  const unitWord = packaging.unitCount > 1 ? 'unités' : 'unité';
  return (
    <li className="flex items-center gap-2 rounded-md bg-surface-raised py-1 pr-1 pl-3 text-sm">
      <span>
        {packaging.label} — {unitCountFormat.format(packaging.unitCount)} {unitWord}
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

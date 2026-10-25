import type { CatalogueSaleItem, SaleItemChanges } from '@ardoise/types';
import { useState } from 'react';
import { formatPrice, formatQuantity } from '../forms/number-format.ts';
import { Badge } from '../ui/badge.tsx';
import { EditButton } from '../ui/edit-button.tsx';
import { SaleItemForm } from './sale-item-form.tsx';

interface SaleItemCardProps {
  saleItem: CatalogueSaleItem;
  stockUnit?: string;
  save: (changes: SaleItemChanges) => Promise<unknown>;
}

export function SaleItemCard({ saleItem, stockUnit, save }: SaleItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <li className="rounded-lg border border-line p-3">
        <SaleItemForm
          hasStock={saleItem.productId !== null}
          stockUnit={stockUnit}
          initialItem={saleItem}
          save={save}
          onDone={() => setIsEditing(false)}
        />
      </li>
    );
  }
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line p-3">
      <span className="min-w-0 flex-1 basis-32 font-semibold break-words">{saleItem.name}</span>
      {saleItem.basePriceCents === null ? (
        <Badge tone="accent">prix à fixer</Badge>
      ) : (
        <span className="font-display text-lg font-bold">
          {formatPrice(saleItem.basePriceCents)}
        </span>
      )}
      <div className="flex basis-full items-center gap-3">
        {saleItem.consumedQuantity !== null && (
          <span className="text-sm text-ink-muted">
            consomme {formatQuantity(saleItem.consumedQuantity)} {stockUnit}
          </span>
        )}
        <span className="ml-auto">
          {saleItem.menuPosition === null ? (
            <Badge>hors carte</Badge>
          ) : (
            <Badge tone="accent">sur la carte</Badge>
          )}
        </span>
        <EditButton itemName={saleItem.name} onClick={() => setIsEditing(true)} />
      </div>
    </li>
  );
}

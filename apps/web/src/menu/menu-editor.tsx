import type { CatalogueSaleItem } from '@ardoise/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { composeMenu, fetchMenu, fetchSaleItems } from '../api/sale-items.ts';
import { formatPrice } from '../forms/number-format.ts';
import { Alert } from '../ui/alert.tsx';
import { Badge } from '../ui/badge.tsx';
import { Button } from '../ui/button.tsx';
import { Card } from '../ui/card.tsx';
import { SearchCombobox } from '../ui/search-combobox.tsx';
import {
  allSaleItemsQueryKey,
  menuQueryKey,
  saleItemsQueryKey,
} from '../catalogue/sale-item-query-keys.ts';

const errorMessage = 'Une erreur est survenue, réessayez plus tard';

export function MenuEditor() {
  const queryClient = useQueryClient();
  const menu = useQuery({ queryKey: menuQueryKey, queryFn: fetchMenu });
  const saleItems = useQuery({ queryKey: allSaleItemsQueryKey, queryFn: fetchSaleItems });
  const composition = useMutation({
    mutationFn: (saleItemIds: string[]) => composeMenu({ saleItemIds }),
    onSuccess: (composedMenu) => queryClient.setQueryData(menuQueryKey, composedMenu),
    onSettled: () => queryClient.invalidateQueries({ queryKey: saleItemsQueryKey }),
  });

  if (menu.isPending || saleItems.isPending) {
    return <p>Chargement…</p>;
  }
  if (menu.isError || saleItems.isError) {
    return <Alert>{errorMessage}</Alert>;
  }

  const menuIds = menu.data.map((saleItem) => saleItem.id);
  const offMenuItems = saleItems.data.filter(
    (saleItem) => saleItem.isActive && saleItem.menuPosition === null,
  );
  const move = (index: number, offset: -1 | 1) => {
    const reordered = [...menuIds];
    [reordered[index], reordered[index + offset]] = [reordered[index + offset]!, reordered[index]!];
    composition.mutate(reordered);
  };

  return (
    <div className="grid gap-3">
      {composition.isError && <Alert>{errorMessage}</Alert>}
      <SearchCombobox
        id="menu-new-item"
        label="Ajouter un article"
        placeholder="Rechercher un article…"
        options={offMenuItems.map((saleItem) => ({
          id: saleItem.id,
          label: saleItem.name,
          detail:
            saleItem.basePriceCents === null
              ? 'prix à fixer'
              : formatPrice(saleItem.basePriceCents),
        }))}
        onSelect={(saleItemId) => {
          if (!composition.isPending) {
            composition.mutate([...menuIds, saleItemId]);
          }
        }}
      />
      <Card>
        {menu.data.length === 0 ? (
          <p className="px-4 py-3 text-ink-muted">Aucun article sur la carte</p>
        ) : (
          <ol aria-label="Carte de la caisse" className="divide-y divide-line">
            {menu.data.map((saleItem, index) => (
              <MenuLine
                key={saleItem.id}
                saleItem={saleItem}
                position={index + 1}
                isFirst={index === 0}
                isLast={index === menu.data.length - 1}
                isLocked={composition.isPending}
                onMoveUp={() => move(index, -1)}
                onMoveDown={() => move(index, 1)}
                onRemove={() => composition.mutate(menuIds.filter((id) => id !== saleItem.id))}
              />
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}

interface MenuLineProps {
  saleItem: CatalogueSaleItem;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  isLocked: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

function MenuLine({
  saleItem,
  position,
  isFirst,
  isLast,
  isLocked,
  onMoveUp,
  onMoveDown,
  onRemove,
}: MenuLineProps) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="w-6 text-ink-muted">{position}.</span>
      <span className="min-w-0 flex-1 basis-32 font-semibold break-words">{saleItem.name}</span>
      {saleItem.basePriceCents === null ? (
        <Badge tone="accent">prix à fixer</Badge>
      ) : (
        <span className="font-semibold">{formatPrice(saleItem.basePriceCents)}</span>
      )}
      <div className="ml-auto flex gap-2">
        <Button
          variant="secondary"
          aria-label={`Monter ${saleItem.name}`}
          disabled={isFirst || isLocked}
          onClick={onMoveUp}
        >
          ↑
        </Button>
        <Button
          variant="secondary"
          aria-label={`Descendre ${saleItem.name}`}
          disabled={isLast || isLocked}
          onClick={onMoveDown}
        >
          ↓
        </Button>
        <Button
          variant="ghost"
          aria-label={`Retirer ${saleItem.name} de la carte`}
          disabled={isLocked}
          onClick={onRemove}
        >
          Retirer
        </Button>
      </div>
    </li>
  );
}

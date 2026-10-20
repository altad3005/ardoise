import { newStocklessSaleItemSchema, type SaleItemChanges } from '@ardoise/types';
import { useQueryClient } from '@tanstack/react-query';
import { createStocklessSaleItem } from '../api/sale-items.ts';
import { Card } from '../ui/card.tsx';
import { SaleItemForm } from './sale-item-form.tsx';
import { stocklessSaleItemsQueryKey } from './sale-item-query-keys.ts';

interface NewStocklessSaleItemFormProps {
  onClose: () => void;
}

export function NewStocklessSaleItemForm({ onClose }: NewStocklessSaleItemFormProps) {
  const queryClient = useQueryClient();

  const create = async (changes: SaleItemChanges) => {
    await createStocklessSaleItem(newStocklessSaleItemSchema.parse(changes));
    await queryClient.invalidateQueries({ queryKey: stocklessSaleItemsQueryKey });
  };

  return (
    <Card className="mb-6 p-4">
      <SaleItemForm hasStock={false} save={create} onDone={onClose} />
    </Card>
  );
}

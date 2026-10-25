import { Pencil } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { Button } from './button.tsx';

interface EditButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  itemName: string;
}

export function EditButton({ itemName, ...props }: EditButtonProps) {
  return (
    <Button variant="secondary" aria-label={`Modifier ${itemName}`} {...props}>
      <Pencil aria-hidden="true" className="size-4" />
      Modifier
    </Button>
  );
}

import { productCategorySchema, type CatalogueProduct } from '@ardoise/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { activateProduct, deactivateProduct, fetchProducts } from '../../api/products.ts';
import { categoryLabels } from '../../catalogue/category-labels.ts';
import { NewProductForm } from '../../catalogue/new-product-form.tsx';
import { Alert } from '../../ui/alert.tsx';
import { Badge } from '../../ui/badge.tsx';
import { Button } from '../../ui/button.tsx';
import { Card } from '../../ui/card.tsx';
import { PageHeader } from '../../ui/page-header.tsx';
import { ToggleButton } from '../../ui/toggle-button.tsx';

export const Route = createFileRoute('/_app/catalogue')({
  component: CataloguePage,
});

const errorMessage = 'Une erreur est survenue, réessayez plus tard';

interface ActivationChange {
  productId: string;
  activate: boolean;
}

function CataloguePage() {
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();
  const products = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
  const activation = useMutation({
    mutationFn: ({ productId, activate }: ActivationChange) =>
      activate ? activateProduct(productId) : deactivateProduct(productId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  if (products.isPending) {
    return <p>Chargement…</p>;
  }
  if (products.isError) {
    return <Alert>{errorMessage}</Alert>;
  }

  const shownProducts = showOnlyActive
    ? products.data.filter((product) => product.isActive)
    : products.data;
  const pendingProductId = activation.isPending ? activation.variables.productId : null;

  return (
    <section>
      <PageHeader
        title="Catalogue"
        actions={
          <>
            <ToggleButton isSelected={!showOnlyActive} onClick={() => setShowOnlyActive(false)}>
              Tous
            </ToggleButton>
            <ToggleButton isSelected={showOnlyActive} onClick={() => setShowOnlyActive(true)}>
              Actifs
            </ToggleButton>
            <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
              Nouveau produit
            </Button>
          </>
        }
      />
      {isCreating && <NewProductForm onClose={() => setIsCreating(false)} />}
      {activation.isError && (
        <div className="mb-4">
          <Alert>{errorMessage}</Alert>
        </div>
      )}
      {shownProducts.length === 0 && <p className="text-ink-muted">Aucun produit actif</p>}
      {productCategorySchema.options.map((category) => (
        <CategorySection
          key={category}
          title={categoryLabels[category]}
          products={shownProducts.filter((product) => product.category === category)}
          pendingProductId={pendingProductId}
          isLocked={activation.isPending}
          onToggle={(product) =>
            activation.mutate({ productId: product.id, activate: !product.isActive })
          }
        />
      ))}
    </section>
  );
}

interface CategorySectionProps {
  title: string;
  products: CatalogueProduct[];
  pendingProductId: string | null;
  isLocked: boolean;
  onToggle: (product: CatalogueProduct) => void;
}

function CategorySection({
  title,
  products,
  pendingProductId,
  isLocked,
  onToggle,
}: CategorySectionProps) {
  if (products.length === 0) {
    return null;
  }
  return (
    <div className="mb-6">
      <h2 className="mb-2 font-display text-xl font-bold">{title}</h2>
      <Card>
        <ul className="divide-y divide-line">
          {products.map((product) => (
            <li key={product.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1 basis-40">
                <p className="font-semibold break-words">{product.name}</p>
                <p className="text-sm text-ink-muted">{product.stockUnit}</p>
              </div>
              <div className="ml-auto flex items-center gap-3">
                {product.isShared ? (
                  <Badge>commun</Badge>
                ) : (
                  <Badge tone="accent">propre à l'association</Badge>
                )}
                <Button
                  variant={product.isActive ? 'secondary' : 'primary'}
                  disabled={isLocked}
                  aria-busy={product.id === pendingProductId}
                  aria-label={`${product.isActive ? 'Désactiver' : 'Activer'} ${product.name}`}
                  onClick={() => onToggle(product)}
                >
                  {product.id === pendingProductId
                    ? '…'
                    : product.isActive
                      ? 'Désactiver'
                      : 'Activer'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

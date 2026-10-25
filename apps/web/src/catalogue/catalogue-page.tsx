import { productCategorySchema, type CatalogueProduct } from '@ardoise/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { activateProduct, deactivateProduct, fetchProducts } from '../api/products.ts';
import { Alert } from '../ui/alert.tsx';
import { Badge } from '../ui/badge.tsx';
import { Button } from '../ui/button.tsx';
import { Card } from '../ui/card.tsx';
import { classNames } from '../ui/class-names.ts';
import { EditButton } from '../ui/edit-button.tsx';
import { PageHeader } from '../ui/page-header.tsx';
import { SearchCombobox } from '../ui/search-combobox.tsx';
import { useMediaQuery } from '../ui/use-media-query.ts';
import { categoryLabels } from './category-labels.ts';
import { NewProductForm } from './new-product-form.tsx';
import { NewStocklessSaleItemForm } from './new-stockless-sale-item-form.tsx';
import { ProductPanel } from './product-panel.tsx';
import { saleItemsQueryKey } from './sale-item-query-keys.ts';
import { StocklessSaleItems } from './stockless-sale-items.tsx';

const errorMessage = 'Une erreur est survenue, réessayez plus tard';

interface ActivationChange {
  productId: string;
  activate: boolean;
}

export function CataloguePage() {
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingStockless, setIsCreatingStockless] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const isWide = useMediaQuery('(min-width: 64rem)');
  const queryClient = useQueryClient();
  const products = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
  const activation = useMutation({
    mutationFn: ({ productId, activate }: ActivationChange) =>
      activate ? activateProduct(productId) : deactivateProduct(productId),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: saleItemsQueryKey }),
      ]),
  });

  if (products.isPending) {
    return <p>Chargement…</p>;
  }
  if (products.isError) {
    return <Alert>{errorMessage}</Alert>;
  }

  const activeProducts = products.data.filter((product) => product.isActive);
  const inactiveProducts = products.data.filter((product) => !product.isActive);
  const selectedProduct = activeProducts.find((product) => product.id === selectedProductId);
  const deactivate = (product: CatalogueProduct) =>
    activation.mutate(
      { productId: product.id, activate: false },
      { onSuccess: () => setSelectedProductId(null) },
    );
  const isDeactivating = activation.isPending && !activation.variables.activate;

  const activate = (productId: string) =>
    activation.mutate(
      { productId, activate: true },
      { onSuccess: () => setSelectedProductId(productId) },
    );

  return (
    <section>
      <PageHeader
        title="Catalogue"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsCreatingStockless(true)}
              disabled={isCreatingStockless}
            >
              Nouvel article sans stock
            </Button>
            <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
              Nouveau produit
            </Button>
          </>
        }
      />
      {isCreating && <NewProductForm onClose={() => setIsCreating(false)} />}
      {isCreatingStockless && (
        <NewStocklessSaleItemForm onClose={() => setIsCreatingStockless(false)} />
      )}
      {activation.isError && (
        <div className="mb-4">
          <Alert>{errorMessage}</Alert>
        </div>
      )}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-6">
        <div>
          <div className="mb-6">
            <SearchCombobox
              id="product-to-activate"
              label="Activer un produit"
              placeholder="Rechercher un produit du catalogue…"
              options={inactiveProducts.map((product) => ({
                id: product.id,
                label: product.name,
                detail: `${categoryLabels[product.category]} · ${product.isShared ? 'commun' : "propre à l'association"}`,
              }))}
              onSelect={(productId) => {
                if (!activation.isPending) {
                  activate(productId);
                }
              }}
            />
          </div>
          {activeProducts.length === 0 && (
            <p className="mb-6 text-ink-muted">
              Aucun produit activé : recherchez un produit du catalogue commun pour l'activer, ou
              créez le vôtre.
            </p>
          )}
          {productCategorySchema.options.map((category) => (
            <CategorySection
              key={category}
              title={categoryLabels[category]}
              products={activeProducts.filter((product) => product.category === category)}
              selectedProductId={selectedProductId}
              showsPanelInline={!isWide}
              isDeactivating={isDeactivating}
              onSelect={(product) =>
                setSelectedProductId(product.id === selectedProductId ? null : product.id)
              }
              onDeactivate={deactivate}
            />
          ))}
          <StocklessSaleItems />
        </div>
        {isWide && selectedProduct && (
          <Card className="sticky top-6">
            <ProductPanel
              product={selectedProduct}
              isDeactivating={isDeactivating}
              onDeactivate={() => deactivate(selectedProduct)}
            />
          </Card>
        )}
      </div>
    </section>
  );
}

interface CategorySectionProps {
  title: string;
  products: CatalogueProduct[];
  selectedProductId: string | null;
  showsPanelInline: boolean;
  isDeactivating: boolean;
  onSelect: (product: CatalogueProduct) => void;
  onDeactivate: (product: CatalogueProduct) => void;
}

function CategorySection({
  title,
  products,
  selectedProductId,
  showsPanelInline,
  isDeactivating,
  onSelect,
  onDeactivate,
}: CategorySectionProps) {
  if (products.length === 0) {
    return null;
  }
  return (
    <div className="mb-6">
      <h2 className="mb-2 font-display text-xl font-bold">{title}</h2>
      <Card>
        <ul className="divide-y divide-line">
          {products.map((product) => {
            const isSelected = product.id === selectedProductId;
            return (
              <li
                key={product.id}
                className={classNames(
                  'flex flex-wrap items-center gap-3 px-4 py-3',
                  isSelected && 'bg-accent-soft',
                )}
              >
                <div className="min-w-0 flex-1 basis-40">
                  <p className="font-semibold break-words">{product.name}</p>
                  <p className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                    {product.stockUnit}
                    {product.isShared ? (
                      <Badge>commun</Badge>
                    ) : (
                      <Badge tone="accent">propre à l'association</Badge>
                    )}
                  </p>
                </div>
                <EditButton
                  itemName={product.name}
                  aria-expanded={isSelected}
                  className="ml-auto"
                  onClick={() => onSelect(product)}
                />
                {isSelected && showsPanelInline && (
                  <div className="-mx-4 basis-full border-t border-line">
                    <ProductPanel
                      product={product}
                      isDeactivating={isDeactivating}
                      onDeactivate={() => onDeactivate(product)}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

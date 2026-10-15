import { productCategorySchema, type CatalogueProduct, type ProductCategory } from '@ardoise/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { activateProduct, deactivateProduct, fetchProducts } from '../api/products.ts';

export const Route = createFileRoute('/catalogue')({
  component: CataloguePage,
});

const categoryLabels: Record<ProductCategory, string> = {
  PILSNER: 'Pils',
  SPECIALTY_BEER: 'Bières spéciales',
  SOFT_DRINK: 'Softs',
  SPIRIT: 'Alcools',
  WINE: 'Vins',
};

const errorMessage = 'Une erreur est survenue, réessayez plus tard';

interface ActivationChange {
  productId: string;
  activate: boolean;
}

function CataloguePage() {
  const [showOnlyActive, setShowOnlyActive] = useState(false);
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
    return (
      <p role="alert" className="text-red-700">
        {errorMessage}
      </p>
    );
  }

  const shownProducts = showOnlyActive
    ? products.data.filter((product) => product.isActive)
    : products.data;
  const pendingProductId = activation.isPending ? activation.variables.productId : null;

  return (
    <section>
      <div className="mb-4 flex items-center">
        <h2 className="text-xl font-semibold">Catalogue</h2>
        <div className="ml-auto flex gap-2">
          <FilterButton isSelected={!showOnlyActive} onClick={() => setShowOnlyActive(false)}>
            Tous
          </FilterButton>
          <FilterButton isSelected={showOnlyActive} onClick={() => setShowOnlyActive(true)}>
            Actifs
          </FilterButton>
        </div>
      </div>
      {activation.isError && (
        <p role="alert" className="mb-4 text-sm text-red-700">
          {errorMessage}
        </p>
      )}
      {shownProducts.length === 0 && <p className="text-stone-500">Aucun produit actif</p>}
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

interface FilterButtonProps {
  isSelected: boolean;
  onClick: () => void;
  children: string;
}

function FilterButton({ isSelected, onClick, children }: FilterButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onClick}
      className="rounded-md border border-stone-300 px-3 py-1 text-sm aria-pressed:bg-stone-900 aria-pressed:text-white"
    >
      {children}
    </button>
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
      <h3 className="mb-2 font-medium text-stone-700">{title}</h3>
      <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
        {products.map((product) => (
          <li key={product.id} className="flex items-center gap-3 px-4 py-2">
            <div>
              <p>{product.name}</p>
              <p className="text-sm text-stone-500">{product.stockUnit}</p>
            </div>
            <button
              type="button"
              disabled={isLocked}
              aria-busy={product.id === pendingProductId}
              aria-label={`${product.isActive ? 'Désactiver' : 'Activer'} ${product.name}`}
              onClick={() => onToggle(product)}
              className={`ml-auto rounded-md px-3 py-1 text-sm font-medium disabled:opacity-60 ${
                product.isActive
                  ? 'border border-stone-300 text-stone-700 hover:bg-stone-100'
                  : 'bg-stone-900 text-white hover:bg-stone-700'
              }`}
            >
              {product.id === pendingProductId ? '…' : product.isActive ? 'Désactiver' : 'Activer'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

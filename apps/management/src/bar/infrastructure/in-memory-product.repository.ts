import { productCategorySchema } from '@ardoise/types';
import type { Product, ProductForAssociation } from '../domain/product.js';
import { ProductRepository } from '../domain/product.repository.js';

interface Activation {
  associationId: string;
  productId: string;
  isActive: boolean;
}

interface StoredSaleItem {
  associationId: string;
  productId: string;
  name: string;
  consumedQuantity: string;
  basePriceCents: number | null;
  isActive: boolean;
}

export class InMemoryProductRepository extends ProductRepository {
  private readonly activations: Activation[] = [];
  private readonly storedSaleItems: StoredSaleItem[] = [];
  private readonly products: Product[];

  constructor(products: readonly Product[]) {
    super();
    this.products = [...products];
  }

  get saleItems(): readonly StoredSaleItem[] {
    return this.storedSaleItems;
  }

  async findVisible(associationId: string): Promise<ProductForAssociation[]> {
    return this.products
      .filter((product) => isVisibleTo(product, associationId))
      .toSorted(byCategoryThenName)
      .map((product) => this.withActivation(associationId, product));
  }

  async findVisibleById(
    associationId: string,
    productId: string,
  ): Promise<ProductForAssociation | null> {
    const product = this.products.find(
      (candidate) => candidate.id === productId && isVisibleTo(candidate, associationId),
    );
    return product ? this.withActivation(associationId, product) : null;
  }

  async existsVisibleWithName(associationId: string, name: string): Promise<boolean> {
    return this.products.some(
      (product) =>
        isVisibleTo(product, associationId) &&
        product.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
  }

  async create(product: Product & { associationId: string }): Promise<void> {
    this.products.push(product);
    this.addActivation(product.associationId, product);
  }

  async activate(associationId: string, product: Product): Promise<void> {
    const activation = this.findActivation(associationId, product.id);
    if (activation) {
      activation.isActive = true;
      return;
    }
    this.addActivation(associationId, product);
  }

  async deactivate(associationId: string, productId: string): Promise<void> {
    const activation = this.findActivation(associationId, productId);
    if (activation) {
      activation.isActive = false;
    }
  }

  private addActivation(associationId: string, product: Product): void {
    this.activations.push({ associationId, productId: product.id, isActive: true });
    this.storedSaleItems.push({
      associationId,
      productId: product.id,
      name: product.name,
      consumedQuantity: '1',
      basePriceCents: null,
      isActive: true,
    });
  }

  private findActivation(associationId: string, productId: string): Activation | undefined {
    return this.activations.find(
      (activation) =>
        activation.associationId === associationId && activation.productId === productId,
    );
  }

  private withActivation(associationId: string, product: Product): ProductForAssociation {
    return {
      ...product,
      isActive: this.findActivation(associationId, product.id)?.isActive ?? false,
    };
  }
}

function isVisibleTo(product: Product, associationId: string): boolean {
  return product.associationId === null || product.associationId === associationId;
}

function byCategoryThenName(first: Product, second: Product): number {
  const categories = productCategorySchema.options;
  return (
    categories.indexOf(first.category) - categories.indexOf(second.category) ||
    first.name.localeCompare(second.name)
  );
}

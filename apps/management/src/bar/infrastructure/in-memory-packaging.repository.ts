import type { Packaging } from '../domain/packaging.js';
import { PackagingRepository } from '../domain/packaging.repository.js';

export class InMemoryPackagingRepository extends PackagingRepository {
  private packagings: Packaging[];

  constructor(packagings: readonly Packaging[]) {
    super();
    this.packagings = [...packagings];
  }

  async findVisible(associationId: string, productId: string): Promise<Packaging[]> {
    return this.packagings
      .filter(
        (packaging) => packaging.productId === productId && isVisibleTo(packaging, associationId),
      )
      .toSorted(bySizeThenLabel);
  }

  async existsVisibleWithLabel(
    associationId: string,
    productId: string,
    label: string,
  ): Promise<boolean> {
    return (await this.findVisible(associationId, productId)).some(
      (packaging) => packaging.label.toLocaleLowerCase() === label.toLocaleLowerCase(),
    );
  }

  async create(packaging: Packaging & { associationId: string }): Promise<void> {
    this.packagings.push(packaging);
  }

  async deleteOwn(associationId: string, productId: string, packagingId: string): Promise<boolean> {
    const remaining = this.packagings.filter(
      (packaging) =>
        packaging.id !== packagingId ||
        packaging.productId !== productId ||
        packaging.associationId !== associationId,
    );
    const isDeleted = remaining.length < this.packagings.length;
    this.packagings = remaining;
    return isDeleted;
  }
}

function isVisibleTo(packaging: Packaging, associationId: string): boolean {
  return packaging.associationId === null || packaging.associationId === associationId;
}

function bySizeThenLabel(first: Packaging, second: Packaging): number {
  return first.unitCount - second.unitCount || first.label.localeCompare(second.label);
}

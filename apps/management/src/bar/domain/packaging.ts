export interface Packaging {
  id: string;
  productId: string;
  associationId: string | null;
  label: string;
  unitCount: number;
}

export class PackagingLabelAlreadyUsedError extends Error {
  constructor() {
    super('Packaging label already used');
  }
}

export class PackagingNotFoundError extends Error {
  constructor() {
    super('Packaging not found');
  }
}

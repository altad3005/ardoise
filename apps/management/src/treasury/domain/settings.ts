import type { TreasurySettings } from '@ardoise/types';

export type Settings = TreasurySettings & { associationId: string };

export function emptySettings(associationId: string): Settings {
  return {
    associationId,
    defaultProjectId: null,
    stockProjectId: null,
    defaultCashAccountId: null,
  };
}

export class NotACashAccountError extends Error {
  constructor() {
    super('The default cash account must be a cash account');
  }
}

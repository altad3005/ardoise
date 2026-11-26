import { treasurySettingsSchema, type TreasurySettings } from '@ardoise/types';
import { ApiError } from './api-error.ts';

const settingsUrl = '/api/management/treasury-settings';

export async function fetchSettings(): Promise<TreasurySettings> {
  const response = await fetch(settingsUrl);
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  return treasurySettingsSchema.parse(await response.json());
}

export async function saveSettings(values: TreasurySettings): Promise<TreasurySettings> {
  const response = await fetch(settingsUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  return treasurySettingsSchema.parse(await response.json());
}

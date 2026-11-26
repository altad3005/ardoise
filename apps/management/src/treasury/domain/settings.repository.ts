import type { Settings } from './settings.js';

export abstract class SettingsRepository {
  abstract find(associationId: string): Promise<Settings | null>;

  abstract save(settings: Settings): Promise<void>;
}

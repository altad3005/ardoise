import type { Settings } from '../domain/settings.js';
import { SettingsRepository } from '../domain/settings.repository.js';

export class InMemorySettingsRepository extends SettingsRepository {
  private readonly settingsByAssociation = new Map<string, Settings>();

  async find(associationId: string): Promise<Settings | null> {
    return this.settingsByAssociation.get(associationId) ?? null;
  }

  async save(settings: Settings): Promise<void> {
    this.settingsByAssociation.set(settings.associationId, settings);
  }
}

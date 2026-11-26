import { Injectable } from '@nestjs/common';
import { emptySettings, type Settings } from '../domain/settings.js';
import { SettingsRepository } from '../domain/settings.repository.js';

@Injectable()
export class GetSettings {
  constructor(private readonly settings: SettingsRepository) {}

  async execute(associationId: string): Promise<Settings> {
    return (await this.settings.find(associationId)) ?? emptySettings(associationId);
  }
}

import { Injectable } from '@nestjs/common';
import type { TreasurySettings } from '@ardoise/types';
import { AccountNotFoundError } from '../domain/account.js';
import { AccountRepository } from '../domain/account.repository.js';
import { ProjectNotFoundError } from '../domain/project.js';
import { ProjectRepository } from '../domain/project.repository.js';
import { NotACashAccountError, type Settings } from '../domain/settings.js';
import { SettingsRepository } from '../domain/settings.repository.js';

@Injectable()
export class UpdateSettings {
  constructor(
    private readonly settings: SettingsRepository,
    private readonly projects: ProjectRepository,
    private readonly accounts: AccountRepository,
  ) {}

  async execute(associationId: string, values: TreasurySettings): Promise<Settings> {
    await this.ensureProjectExists(associationId, values.defaultProjectId);
    await this.ensureProjectExists(associationId, values.stockProjectId);
    await this.ensureCashAccount(associationId, values.defaultCashAccountId);
    const updated = { associationId, ...values };
    await this.settings.save(updated);
    return updated;
  }

  private async ensureProjectExists(associationId: string, projectId: string | null) {
    if (projectId && !(await this.projects.findById(associationId, projectId))) {
      throw new ProjectNotFoundError();
    }
  }

  private async ensureCashAccount(associationId: string, accountId: string | null) {
    if (!accountId) {
      return;
    }
    const account = await this.accounts.findById(associationId, accountId);
    if (!account) {
      throw new AccountNotFoundError();
    }
    if (account.type !== 'CASH') {
      throw new NotACashAccountError();
    }
  }
}

import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Put,
  UnprocessableEntityException,
} from '@nestjs/common';
import { treasurySettingsSchema, type TreasurySettings } from '@ardoise/types';
import type { AssociationContext } from '../../association-context/association-context.js';
import { CurrentContext, RequireRoles } from '../../association-context/decorators.js';
import { GetSettings } from '../application/get-settings.use-case.js';
import { UpdateSettings } from '../application/update-settings.use-case.js';
import { AccountNotFoundError } from '../domain/account.js';
import { ProjectNotFoundError } from '../domain/project.js';
import { NotACashAccountError, type Settings } from '../domain/settings.js';

@Controller('treasury-settings')
export class SettingsController {
  constructor(
    private readonly getSettings: GetSettings,
    private readonly updateSettings: UpdateSettings,
  ) {}

  @Get()
  @RequireRoles('TREASURER', 'VIEWER')
  async get(@CurrentContext() context: AssociationContext): Promise<TreasurySettings> {
    return toTreasurySettings(await this.getSettings.execute(context.associationId));
  }

  @Put()
  @RequireRoles('ADMINISTRATOR')
  async update(
    @CurrentContext() context: AssociationContext,
    @Body({ schema: treasurySettingsSchema }) values: TreasurySettings,
  ): Promise<TreasurySettings> {
    const settings = await rethrowAsHttp(
      this.updateSettings.execute(context.associationId, values),
    );
    return toTreasurySettings(settings);
  }
}

function toTreasurySettings({
  defaultProjectId,
  stockProjectId,
  defaultCashAccountId,
}: Settings): TreasurySettings {
  return { defaultProjectId, stockProjectId, defaultCashAccountId };
}

async function rethrowAsHttp<T>(operation: Promise<T>): Promise<T> {
  try {
    return await operation;
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      throw new NotFoundException('Project not found');
    }
    if (error instanceof AccountNotFoundError) {
      throw new NotFoundException('Account not found');
    }
    if (error instanceof NotACashAccountError) {
      throw new UnprocessableEntityException('The default cash account must be a cash account');
    }
    throw error;
  }
}

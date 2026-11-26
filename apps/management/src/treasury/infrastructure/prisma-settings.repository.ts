import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import type { Settings } from '../domain/settings.js';
import { SettingsRepository } from '../domain/settings.repository.js';

@Injectable()
export class PrismaSettingsRepository extends SettingsRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  find(associationId: string): Promise<Settings | null> {
    return this.prisma.treasurySettings.findUnique({ where: { associationId } });
  }

  async save({ associationId, ...values }: Settings): Promise<void> {
    await this.prisma.treasurySettings.upsert({
      where: { associationId },
      create: { associationId, ...values },
      update: values,
    });
  }
}

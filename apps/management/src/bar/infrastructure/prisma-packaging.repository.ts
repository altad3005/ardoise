import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../database/generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import type { Packaging } from '../domain/packaging.js';
import { PackagingRepository } from '../domain/packaging.repository.js';

@Injectable()
export class PrismaPackagingRepository extends PackagingRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findVisible(associationId: string, productId: string): Promise<Packaging[]> {
    const packagings = await this.prisma.packaging.findMany({
      where: { productId, ...visibleTo(associationId) },
      orderBy: [{ unitCount: 'asc' }, { label: 'asc' }],
    });
    return packagings.map(toPackaging);
  }

  async existsVisibleWithLabel(
    associationId: string,
    productId: string,
    label: string,
  ): Promise<boolean> {
    const count = await this.prisma.packaging.count({
      where: {
        productId,
        ...visibleTo(associationId),
        label: { equals: label, mode: 'insensitive' },
      },
    });
    return count > 0;
  }

  async create(packaging: Packaging & { associationId: string }): Promise<void> {
    await this.prisma.packaging.create({ data: packaging });
  }

  async deleteOwn(associationId: string, productId: string, packagingId: string): Promise<boolean> {
    const { count } = await this.prisma.packaging.deleteMany({
      where: { id: packagingId, productId, associationId },
    });
    return count > 0;
  }
}

function visibleTo(associationId: string) {
  return { OR: [{ associationId: null }, { associationId }] };
}

function toPackaging({
  unitCount,
  ...packaging
}: Omit<Packaging, 'unitCount'> & { unitCount: Prisma.Decimal }): Packaging {
  return { ...packaging, unitCount: unitCount.toNumber() };
}

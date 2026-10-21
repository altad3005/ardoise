import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../database/generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import type { SaleItem } from '../domain/sale-item.js';
import { SaleItemRepository } from '../domain/sale-item.repository.js';

@Injectable()
export class PrismaSaleItemRepository extends SaleItemRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByProduct(associationId: string, productId: string): Promise<SaleItem[]> {
    const saleItems = await this.prisma.saleItem.findMany({
      where: { associationId, productId },
      orderBy: [{ consumedQuantity: 'asc' }, { name: 'asc' }],
    });
    return saleItems.map(toSaleItem);
  }

  async findStockless(associationId: string): Promise<SaleItem[]> {
    const saleItems = await this.prisma.saleItem.findMany({
      where: { associationId, productId: null },
      orderBy: { name: 'asc' },
    });
    return saleItems.map(toSaleItem);
  }

  async findOnMenu(associationId: string): Promise<SaleItem[]> {
    const saleItems = await this.prisma.saleItem.findMany({
      where: { associationId, menuPosition: { not: null } },
      orderBy: { menuPosition: 'asc' },
    });
    return saleItems.map(toSaleItem);
  }

  async findById(associationId: string, saleItemId: string): Promise<SaleItem | null> {
    const saleItem = await this.prisma.saleItem.findFirst({
      where: { id: saleItemId, associationId },
    });
    return saleItem ? toSaleItem(saleItem) : null;
  }

  async existsWithName(
    associationId: string,
    name: string,
    exceptSaleItemId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.saleItem.count({
      where: {
        associationId,
        name: { equals: name, mode: 'insensitive' },
        ...(exceptSaleItemId && { id: { not: exceptSaleItemId } }),
      },
    });
    return count > 0;
  }

  async create(saleItem: SaleItem): Promise<void> {
    await this.prisma.saleItem.create({ data: saleItem });
  }

  async update(saleItem: SaleItem): Promise<void> {
    await this.prisma.saleItem.updateMany({
      where: { id: saleItem.id, associationId: saleItem.associationId },
      data: {
        name: saleItem.name,
        consumedQuantity: saleItem.consumedQuantity,
        basePriceCents: saleItem.basePriceCents,
      },
    });
  }

  async replaceMenu(associationId: string, saleItemIds: readonly string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.saleItem.updateMany({
        where: { associationId, menuPosition: { not: null } },
        data: { menuPosition: null },
      }),
      ...saleItemIds.map((id, menuPosition) =>
        this.prisma.saleItem.updateMany({ where: { id, associationId }, data: { menuPosition } }),
      ),
    ]);
  }
}

function toSaleItem({
  consumedQuantity,
  ...saleItem
}: Omit<SaleItem, 'consumedQuantity'> & { consumedQuantity: Prisma.Decimal | null }): SaleItem {
  return { ...saleItem, consumedQuantity: consumedQuantity?.toNumber() ?? null };
}

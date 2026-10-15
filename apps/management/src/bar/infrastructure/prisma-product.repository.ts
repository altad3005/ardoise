import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import type { Product, ProductForAssociation } from '../domain/product.js';
import { ProductRepository } from '../domain/product.repository.js';

@Injectable()
export class PrismaProductRepository extends ProductRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findVisible(associationId: string): Promise<ProductForAssociation[]> {
    const products = await this.prisma.product.findMany({
      where: visibleTo(associationId),
      include: { associationProducts: { where: { associationId } } },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    return products.map(toProductForAssociation);
  }

  async findVisibleById(
    associationId: string,
    productId: string,
  ): Promise<ProductForAssociation | null> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, ...visibleTo(associationId) },
      include: { associationProducts: { where: { associationId } } },
    });
    return product ? toProductForAssociation(product) : null;
  }

  async activate(associationId: string, product: Product): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const { count } = await transaction.associationProduct.createMany({
        data: [{ associationId, productId: product.id, isActive: true }],
        skipDuplicates: true,
      });
      if (count === 0) {
        await transaction.associationProduct.update({
          where: { associationId_productId: { associationId, productId: product.id } },
          data: { isActive: true },
        });
        return;
      }
      await transaction.saleItem.create({
        data: {
          id: randomUUID(),
          associationId,
          productId: product.id,
          name: product.name,
          consumedQuantity: 1,
          basePriceCents: null,
          isActive: true,
        },
      });
    });
  }

  async deactivate(associationId: string, productId: string): Promise<void> {
    await this.prisma.associationProduct.updateMany({
      where: { associationId, productId },
      data: { isActive: false },
    });
  }
}

function visibleTo(associationId: string) {
  return { OR: [{ associationId: null }, { associationId }] };
}

function toProductForAssociation({
  associationProducts,
  ...product
}: Product & { associationProducts: { isActive: boolean }[] }): ProductForAssociation {
  return { ...product, isActive: associationProducts[0]?.isActive ?? false };
}

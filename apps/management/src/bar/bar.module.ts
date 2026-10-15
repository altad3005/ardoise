import { Module } from '@nestjs/common';
import { DirectoryModule } from '../directory/directory.module.js';
import { TreasuryModule } from '../treasury/treasury.module.js';
import { ActivateProduct } from './application/activate-product.use-case.js';
import { DeactivateProduct } from './application/deactivate-product.use-case.js';
import { ListProducts } from './application/list-products.use-case.js';
import { ProductRepository } from './domain/product.repository.js';
import { ProductsController } from './http/products.controller.js';
import { PrismaProductRepository } from './infrastructure/prisma-product.repository.js';

@Module({
  imports: [TreasuryModule, DirectoryModule],
  controllers: [ProductsController],
  providers: [
    ListProducts,
    ActivateProduct,
    DeactivateProduct,
    { provide: ProductRepository, useClass: PrismaProductRepository },
  ],
})
export class BarModule {}

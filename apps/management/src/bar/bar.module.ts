import { Module } from '@nestjs/common';
import { DirectoryModule } from '../directory/directory.module.js';
import { TreasuryModule } from '../treasury/treasury.module.js';
import { ActivateProduct } from './application/activate-product.use-case.js';
import { CreatePackaging } from './application/create-packaging.use-case.js';
import { CreateProduct } from './application/create-product.use-case.js';
import { CreateSaleItem } from './application/create-sale-item.use-case.js';
import { CreateStocklessSaleItem } from './application/create-stockless-sale-item.use-case.js';
import { DeactivateProduct } from './application/deactivate-product.use-case.js';
import { DeletePackaging } from './application/delete-packaging.use-case.js';
import { ListPackagings } from './application/list-packagings.use-case.js';
import { ListProductSaleItems } from './application/list-product-sale-items.use-case.js';
import { ListProducts } from './application/list-products.use-case.js';
import { ListStocklessSaleItems } from './application/list-stockless-sale-items.use-case.js';
import { UpdateSaleItem } from './application/update-sale-item.use-case.js';
import { PackagingRepository } from './domain/packaging.repository.js';
import { ProductRepository } from './domain/product.repository.js';
import { SaleItemRepository } from './domain/sale-item.repository.js';
import { PackagingsController } from './http/packagings.controller.js';
import { ProductsController } from './http/products.controller.js';
import { SaleItemsController } from './http/sale-items.controller.js';
import { PrismaPackagingRepository } from './infrastructure/prisma-packaging.repository.js';
import { PrismaProductRepository } from './infrastructure/prisma-product.repository.js';
import { PrismaSaleItemRepository } from './infrastructure/prisma-sale-item.repository.js';

@Module({
  imports: [TreasuryModule, DirectoryModule],
  controllers: [ProductsController, PackagingsController, SaleItemsController],
  providers: [
    ListProducts,
    ActivateProduct,
    DeactivateProduct,
    CreateProduct,
    ListPackagings,
    CreatePackaging,
    DeletePackaging,
    ListProductSaleItems,
    ListStocklessSaleItems,
    CreateSaleItem,
    CreateStocklessSaleItem,
    UpdateSaleItem,
    { provide: ProductRepository, useClass: PrismaProductRepository },
    { provide: PackagingRepository, useClass: PrismaPackagingRepository },
    { provide: SaleItemRepository, useClass: PrismaSaleItemRepository },
  ],
})
export class BarModule {}

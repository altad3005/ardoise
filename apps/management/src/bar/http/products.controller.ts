import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { newProductSchema, type CatalogueProduct, type NewProduct } from '@ardoise/types';
import type { AssociationContext } from '../../association-context/association-context.js';
import { CurrentContext, RequireRoles } from '../../association-context/decorators.js';
import { ActivateProduct } from '../application/activate-product.use-case.js';
import { CreateProduct } from '../application/create-product.use-case.js';
import { DeactivateProduct } from '../application/deactivate-product.use-case.js';
import { ListProducts } from '../application/list-products.use-case.js';
import { ProductNameAlreadyUsedError, ProductNotFoundError } from '../domain/product.js';

const productIdPipe = new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND });

@Controller('products')
export class ProductsController {
  constructor(
    private readonly listProducts: ListProducts,
    private readonly activateProduct: ActivateProduct,
    private readonly deactivateProduct: DeactivateProduct,
    private readonly createProduct: CreateProduct,
  ) {}

  @Get()
  async list(@CurrentContext() context: AssociationContext): Promise<CatalogueProduct[]> {
    const products = await this.listProducts.execute(context.associationId);
    return products.map(({ associationId, ...product }) => ({
      ...product,
      isShared: associationId === null,
    }));
  }

  @Post()
  @RequireRoles('STOCK_MANAGER')
  async create(
    @CurrentContext() context: AssociationContext,
    @Body({ schema: newProductSchema }) newProduct: NewProduct,
  ): Promise<CatalogueProduct> {
    try {
      const product = await this.createProduct.execute(context.associationId, newProduct);
      return {
        id: product.id,
        name: product.name,
        category: product.category,
        stockUnit: product.stockUnit,
        isShared: false,
        isActive: true,
      };
    } catch (error) {
      if (error instanceof ProductNameAlreadyUsedError) {
        throw new ConflictException('A product already uses this name');
      }
      throw error;
    }
  }

  @Put(':productId/activation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRoles('STOCK_MANAGER')
  async activate(
    @CurrentContext() context: AssociationContext,
    @Param('productId', productIdPipe) productId: string,
  ): Promise<void> {
    await rethrowNotFound(this.activateProduct.execute(context.associationId, productId));
  }

  @Delete(':productId/activation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRoles('STOCK_MANAGER')
  async deactivate(
    @CurrentContext() context: AssociationContext,
    @Param('productId', productIdPipe) productId: string,
  ): Promise<void> {
    await rethrowNotFound(this.deactivateProduct.execute(context.associationId, productId));
  }
}

async function rethrowNotFound(operation: Promise<void>): Promise<void> {
  try {
    await operation;
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      throw new NotFoundException('Product not found');
    }
    throw error;
  }
}

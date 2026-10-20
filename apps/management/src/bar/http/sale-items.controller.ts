import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  newSaleItemSchema,
  newStocklessSaleItemSchema,
  saleItemChangesSchema,
  type CatalogueSaleItem,
  type NewSaleItem,
  type NewStocklessSaleItem,
  type SaleItemChanges,
} from '@ardoise/types';
import type { AssociationContext } from '../../association-context/association-context.js';
import { CurrentContext, RequireRoles } from '../../association-context/decorators.js';
import { CreateSaleItem } from '../application/create-sale-item.use-case.js';
import { CreateStocklessSaleItem } from '../application/create-stockless-sale-item.use-case.js';
import { ListProductSaleItems } from '../application/list-product-sale-items.use-case.js';
import { ListStocklessSaleItems } from '../application/list-stockless-sale-items.use-case.js';
import { UpdateSaleItem } from '../application/update-sale-item.use-case.js';
import { ProductNotFoundError } from '../domain/product.js';
import {
  SaleItemConsumptionMismatchError,
  SaleItemNameAlreadyUsedError,
  SaleItemNotFoundError,
  type SaleItem,
} from '../domain/sale-item.js';

const idPipe = new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND });

@Controller()
export class SaleItemsController {
  constructor(
    private readonly listProductSaleItems: ListProductSaleItems,
    private readonly listStocklessSaleItems: ListStocklessSaleItems,
    private readonly createSaleItem: CreateSaleItem,
    private readonly createStocklessSaleItem: CreateStocklessSaleItem,
    private readonly updateSaleItem: UpdateSaleItem,
  ) {}

  @Get('products/:productId/sale-items')
  async listForProduct(
    @CurrentContext() context: AssociationContext,
    @Param('productId', idPipe) productId: string,
  ): Promise<CatalogueSaleItem[]> {
    const saleItems = await rethrowAsHttp(
      this.listProductSaleItems.execute(context.associationId, productId),
    );
    return saleItems.map(toCatalogueSaleItem);
  }

  @Post('products/:productId/sale-items')
  @RequireRoles('STOCK_MANAGER')
  async createForProduct(
    @CurrentContext() context: AssociationContext,
    @Param('productId', idPipe) productId: string,
    @Body({ schema: newSaleItemSchema }) newSaleItem: NewSaleItem,
  ): Promise<CatalogueSaleItem> {
    const saleItem = await rethrowAsHttp(
      this.createSaleItem.execute(context.associationId, productId, newSaleItem),
    );
    return toCatalogueSaleItem(saleItem);
  }

  @Get('stockless-sale-items')
  async listStockless(@CurrentContext() context: AssociationContext): Promise<CatalogueSaleItem[]> {
    const saleItems = await this.listStocklessSaleItems.execute(context.associationId);
    return saleItems.map(toCatalogueSaleItem);
  }

  @Post('stockless-sale-items')
  @RequireRoles('STOCK_MANAGER')
  async createStockless(
    @CurrentContext() context: AssociationContext,
    @Body({ schema: newStocklessSaleItemSchema }) newSaleItem: NewStocklessSaleItem,
  ): Promise<CatalogueSaleItem> {
    const saleItem = await rethrowAsHttp(
      this.createStocklessSaleItem.execute(context.associationId, newSaleItem),
    );
    return toCatalogueSaleItem(saleItem);
  }

  @Put('sale-items/:saleItemId')
  @RequireRoles('STOCK_MANAGER')
  async update(
    @CurrentContext() context: AssociationContext,
    @Param('saleItemId', idPipe) saleItemId: string,
    @Body({ schema: saleItemChangesSchema }) changes: SaleItemChanges,
  ): Promise<CatalogueSaleItem> {
    const saleItem = await rethrowAsHttp(
      this.updateSaleItem.execute(context.associationId, saleItemId, changes),
    );
    return toCatalogueSaleItem(saleItem);
  }
}

function toCatalogueSaleItem(saleItem: SaleItem): CatalogueSaleItem {
  return {
    id: saleItem.id,
    productId: saleItem.productId,
    name: saleItem.name,
    consumedQuantity: saleItem.consumedQuantity,
    basePriceCents: saleItem.basePriceCents,
    isActive: saleItem.isActive,
  };
}

async function rethrowAsHttp<T>(operation: Promise<T>): Promise<T> {
  try {
    return await operation;
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      throw new NotFoundException('Product not found');
    }
    if (error instanceof SaleItemNotFoundError) {
      throw new NotFoundException('Sale item not found');
    }
    if (error instanceof SaleItemNameAlreadyUsedError) {
      throw new ConflictException('A sale item already uses this name');
    }
    if (error instanceof SaleItemConsumptionMismatchError) {
      throw new BadRequestException('Only an item with stock has a consumed quantity');
    }
    throw error;
  }
}

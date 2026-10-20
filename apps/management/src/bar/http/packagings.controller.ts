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
} from '@nestjs/common';
import { newPackagingSchema, type NewPackaging, type PurchasePackaging } from '@ardoise/types';
import type { AssociationContext } from '../../association-context/association-context.js';
import { CurrentContext, RequireRoles } from '../../association-context/decorators.js';
import { CreatePackaging } from '../application/create-packaging.use-case.js';
import { DeletePackaging } from '../application/delete-packaging.use-case.js';
import { ListPackagings } from '../application/list-packagings.use-case.js';
import {
  PackagingLabelAlreadyUsedError,
  PackagingNotFoundError,
  type Packaging,
} from '../domain/packaging.js';
import { ProductNotFoundError } from '../domain/product.js';

const idPipe = new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND });

@Controller('products/:productId/packagings')
export class PackagingsController {
  constructor(
    private readonly listPackagings: ListPackagings,
    private readonly createPackaging: CreatePackaging,
    private readonly deletePackaging: DeletePackaging,
  ) {}

  @Get()
  async list(
    @CurrentContext() context: AssociationContext,
    @Param('productId', idPipe) productId: string,
  ): Promise<PurchasePackaging[]> {
    const packagings = await rethrowAsHttp(
      this.listPackagings.execute(context.associationId, productId),
    );
    return packagings.map(toPurchasePackaging);
  }

  @Post()
  @RequireRoles('STOCK_MANAGER')
  async create(
    @CurrentContext() context: AssociationContext,
    @Param('productId', idPipe) productId: string,
    @Body({ schema: newPackagingSchema }) newPackaging: NewPackaging,
  ): Promise<PurchasePackaging> {
    const packaging = await rethrowAsHttp(
      this.createPackaging.execute(context.associationId, productId, newPackaging),
    );
    return toPurchasePackaging(packaging);
  }

  @Delete(':packagingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRoles('STOCK_MANAGER')
  async delete(
    @CurrentContext() context: AssociationContext,
    @Param('productId', idPipe) productId: string,
    @Param('packagingId', idPipe) packagingId: string,
  ): Promise<void> {
    await rethrowAsHttp(
      this.deletePackaging.execute(context.associationId, productId, packagingId),
    );
  }
}

function toPurchasePackaging(packaging: Packaging): PurchasePackaging {
  return {
    id: packaging.id,
    label: packaging.label,
    unitCount: packaging.unitCount,
    isShared: packaging.associationId === null,
  };
}

async function rethrowAsHttp<T>(operation: Promise<T>): Promise<T> {
  try {
    return await operation;
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      throw new NotFoundException('Product not found');
    }
    if (error instanceof PackagingNotFoundError) {
      throw new NotFoundException('Packaging not found');
    }
    if (error instanceof PackagingLabelAlreadyUsedError) {
      throw new ConflictException('A packaging already uses this label');
    }
    throw error;
  }
}

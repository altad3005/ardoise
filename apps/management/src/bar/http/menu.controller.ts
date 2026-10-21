import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  menuCompositionSchema,
  type CatalogueSaleItem,
  type MenuComposition,
} from '@ardoise/types';
import type { AssociationContext } from '../../association-context/association-context.js';
import { CurrentContext, RequireRoles } from '../../association-context/decorators.js';
import { ComposeMenu } from '../application/compose-menu.use-case.js';
import { GetMenu } from '../application/get-menu.use-case.js';
import { rethrowAsHttp, toCatalogueSaleItem } from './sale-item-responses.js';

@Controller('menu')
export class MenuController {
  constructor(
    private readonly getMenu: GetMenu,
    private readonly composeMenu: ComposeMenu,
  ) {}

  @Get()
  async get(@CurrentContext() context: AssociationContext): Promise<CatalogueSaleItem[]> {
    const menu = await this.getMenu.execute(context.associationId);
    return menu.map(toCatalogueSaleItem);
  }

  @Put()
  @RequireRoles('STOCK_MANAGER')
  async compose(
    @CurrentContext() context: AssociationContext,
    @Body({ schema: menuCompositionSchema }) composition: MenuComposition,
  ): Promise<CatalogueSaleItem[]> {
    const menu = await rethrowAsHttp(
      this.composeMenu.execute(context.associationId, composition.saleItemIds),
    );
    return menu.map(toCatalogueSaleItem);
  }
}

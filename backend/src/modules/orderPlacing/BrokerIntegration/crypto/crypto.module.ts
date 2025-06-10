import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BinanceBalanceService } from './binance/2-binance-Balance-utils';
import { BinancePlaceOrderService } from './binance/4-binance-place-order-handler';
import { CheckPendingSchema, CheckPendingType } from './binance/8-binace-check-pending-order.schema';
import {CheckExtraSchema , CheckExtraType} from './binance/9-binance-check-extra-manupulation.schema'
import { ExtraPendingDeleteService } from './binance/6-binance-check-extra-manupulation';
import { EntryCountSchema, EntryCountType } from './binance/10-binance-future-entry-count-schema';
import { BinanceOrderManagementService } from './binance/7-binance-modify-SL&T-closePosi';

@Module({
  imports: [
    MongooseModule.forFeature([
      
      { name: CheckPendingType.name, schema: CheckPendingSchema },
      { name: CheckExtraType.name, schema: CheckExtraSchema },
      { name: EntryCountType.name , schema: EntryCountSchema },
    ]),
  ],
  providers: [BinanceOrderManagementService,ExtraPendingDeleteService,BinancePlaceOrderService, BinanceBalanceService,],
  exports: [BinanceOrderManagementService,ExtraPendingDeleteService,BinancePlaceOrderService, BinanceBalanceService],
})
export class CryptoModule {}




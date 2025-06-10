/*
import { Injectable, BadRequestException } from '@nestjs/common';
import { BinanceBrokerService } from './crypto/binance/4-binance-final-order-handler';
//import { BybitBrokerService } from './crypto/bybit-broker.service';
//import { OkxBrokerService } from './crypto/okx-broker.service';
//import { UpstoxBrokerService } from './stock/upstox-broker.service';
//import { ZerodhaBrokerService } from './stock/zerodha-broker.service';
//import { AngelOneBrokerService } from './stock/angel-one-broker.service';
//import { CtraderBrokerService } from './forex/ctrader-broker.service';

@Injectable()
export class BrokerFactory {
  constructor(
    private readonly binanceBroker: BinanceBrokerService,
    
   
  ) {}

  getBroker(marketType: string, brokerName: string): any {
    const key = `${marketType.toLowerCase()}:${brokerName.toLowerCase()}`;
    console.log(`Selecting broker: ${key}`);
    switch (key) {
      case 'cryptocurrency:binance':
        return this.binanceBroker;
      default:
        console.error(`Unsupported market type or broker: ${key}`);
        throw new BadRequestException(`Unsupported market type or broker: ${marketType}:${brokerName}`);
    }
  }
}

*/


import { Injectable, BadRequestException } from '@nestjs/common';
import { BinanceBalanceService } from './crypto/binance/2-binance-Balance-utils';
import { BinancePlaceOrderService } from './crypto/binance/4-binance-place-order-handler';
import { BinanceOrderManagementService } from './crypto/binance/7-binance-modify-SL&T-closePosi';


@Injectable()
export class BrokerFactory {
  constructor(

    private readonly binanceBalance: BinanceBalanceService,
    private readonly binancePlaceOrder: BinancePlaceOrderService,
    private readonly binanceOrderManagement: BinanceOrderManagementService
  ) {}
  getBroker(marketType: string, brokerName: string, orderType?: string, operation?: string): (...args: any[]) => Promise<any> {
    const key = `${marketType.toLowerCase()}:${brokerName.toLowerCase()}${orderType ? `:${orderType.toLowerCase()}` : ''}${operation ? `:${operation.toLowerCase()}` : ''}`;
    console.log(`Selecting broker: ${key}`);

    // Handle sub-broker operations
    switch (key) {
      case 'cryptocurrency:binance:cash:getbalance':
        return this.binanceBalance.getCashBalance.bind(this.binanceBalance);
      case 'cryptocurrency:binance:future:getbalance':
        return this.binanceBalance.getFutureBalance.bind(this.binanceBalance);
      case 'cryptocurrency:binance:option:getbalance':
        return this.binanceBalance.getOptionBalance.bind(this.binanceBalance);

        case 'cryptocurrency:binance:cash:placeorder':
        //  return this.binancePlaceOrder.placeCashNewOrder.bind(this.binancePlaceOrder);     
        case 'cryptocurrency:binance:future:placeorder':
          return this.binancePlaceOrder.placeFutureNewOrder.bind(this.binancePlaceOrder);
        case 'cryptocurrency:binance:option:placeorder':
        //  return this.binancePlaceOrder.placeOptionNewOrder.bind(this.binancePlaceOrder);     
      
        //cancel order
        case 'cryptocurrency:binance:cash:cancelorder':
          //  return this.binancePlaceOrder.placeCashNewOrder.bind(this.binancePlaceOrder);     
          case 'cryptocurrency:binance:future:cancelorder':
            return this.binanceOrderManagement.cancelOrder.bind(this.binanceOrderManagement);
          case 'cryptocurrency:binance:option:cancelorder':
          //  return this.binancePlaceOrder.placeOptionNewOrder.bind(this.binancePlaceOrder);     

//close position
          case 'cryptocurrency:binance:cash:closeposition':
            //  return this.binancePlaceOrder.placeCashNewOrder.bind(this.binancePlaceOrder);     
            case 'cryptocurrency:binance:future:closeposition':
              return this.binanceOrderManagement.closePosition.bind(this.binanceOrderManagement);
            case 'cryptocurrency:binance:option:closeposition':
            //  return this.binancePlaceOrder.placeOptionNewOrder.bind(this.binancePlaceOrder);     
  
  












      default:



        console.error(`Unsupported sub-broker operation: ${key}`);
        throw new BadRequestException(`Unsupported sub-broker operation: ${key}`);
    }
  }
}
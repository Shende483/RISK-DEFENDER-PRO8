import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OrderSide, USDMClient, FuturesOrderType } from 'binance';
import * as moment from 'moment-timezone';
import { Model } from 'mongoose';
import { get } from './5-binance-check-pending-orders'; // Adjust path as needed
import { CheckPendingDocument, CheckPendingType } from './8-binace-check-pending-order.schema'; // Adjust path
import { EntryCountDocument, EntryCountType } from './10-binance-future-entry-count-schema'; // Adjust path

// Order data interface
interface OrderData {
  symbol: string;
  orderId?: number;
  positionAmt?: number;
  side?: OrderSide;
  type: 'MARKET' | 'LIMIT' | 'STOP_MARKET' | 'TAKE_PROFIT_MARKET';
  orderType?: 'STOP_MARKET' | 'TAKE_PROFIT_MARKET';
  cancel?: string;
  oldStopLoss?: number;
  lastUpdate?: string;
  price?: number;
  updateTime?: string;
  clientId?: string;
  userName?: string;
  ipAddress?: string;
  httpPort?: number;
  ipUsername?: string;
  ipPassword?: string;
  riskFactor?: number;
  quntity?:number
}

// Rate-limiting tracking
interface RateLimitTracking {
  [userId: string]: {
    [key: string]: number; // Tracks last request time
  };
}

interface ProcessingTracking {
  [userId: string]: {
    [key: string]: boolean; // Tracks processing status
  };
}

@Injectable()
export class BinanceOrderManagementService {
  private readonly getAnd: (
    Name: string,
    api_key: string,
    api_secret: string,
    ipAddress: string,
    httpPort: number,
    ipUsername: string,
    ipPassword: string,
    symbol: string,
    orderId: number,
    stopLossPrice: number,
    takeProfitPrice: number,
    quantity: string,
    side: OrderSide,
    riskFactor: number,
  ) => Promise<void>;

  private client: USDMClient | null = null;
  private existingSubbroker: any = null; // Simplified, assuming similar structure
  private lastCancelOrderTime: RateLimitTracking = {};
  private isCancelOrderProcessing: ProcessingTracking = {};
  private lastOrderTimeByUserAndSymbol: RateLimitTracking = {};
  private isProcessingOrderByUserAndSymbol: ProcessingTracking = {};
  private lastModifyOrderTime: RateLimitTracking = {};
  private isModifyOrderProcessing: ProcessingTracking = {};

  constructor(
    @InjectModel(CheckPendingType.name) private orderModel: Model<CheckPendingDocument>,
    @InjectModel(EntryCountType.name) private entryCountModel: Model<EntryCountDocument>,
  ) {
    this.getAnd = get(this.orderModel).getAnd;
  }

  // Initialize client
  async orderManagementService(
       userId: string,
       apiKey: string,
       apiSecret: string,
       brokerAccountName:string,
       orderData: OrderData,
  ): Promise<{ success: boolean; message: string  }> {
       try {
              let client = new USDMClient({
                api_key: apiKey,
                api_secret: apiSecret,
                recvWindow: 4000,
              });
        
              this.client = client;
              console.log('USDMClient initialized successfully for user:', userId);
              return { success: true, message: 'Client initialized successfully' };
            } catch (error) {
              console.error('Error initializing client:', error);
              return { success: false, message: `Failed to initialize client: ${error.message}` };
            }
  }

  // Decrement entry counts
  private async updateEntryCounts(userId: string, symbol: string, subbroker?: string): Promise<void> {
    try {
      const today = new Date();

      const updateFields: any = {
        $inc: {
          totalDailyEntryCount: -1,
          [`symbolCounts.${symbol}`]: -1,
        },
        $setOnInsert: {
          userId,
          date: today,
          subbroker,
          symbolCounts: {},
        },
      };

      const entryCount = await this.entryCountModel.findOneAndUpdate(
        { userId, date: today },
        updateFields,
        { upsert: true, new: true },
      );

      console.log(`Decremented entry counts for user ${userId}:`, {
        totalDailyEntryCount: entryCount.totalDailyEntryCount,
        symbolCounts: entryCount.symbolCounts,
      });
    } catch (error) {
      console.error('Error decrementing entry counts:', error);
    }
  }



  // Cancel Order
  async cancelOrder(
    userId: string,
    apiKey: string,
    apiSecret: string,
    brokerAccountName: string,
    orderData: OrderData,
  ): Promise<{ success: boolean; message: string; orderId?: string }> {
    const { symbol, orderId } = orderData;
    if (!symbol || !orderId) {
      console.error('Validation error: Symbol and orderId are required');
      return { success: false, message: 'Symbol and orderId are required' };
    }

    const currentTime = Date.now();
    this.lastCancelOrderTime[userId] = this.lastCancelOrderTime[userId] || {};
    this.isCancelOrderProcessing[userId] = this.isCancelOrderProcessing[userId] || {};

    if (currentTime - (this.lastCancelOrderTime[userId][orderId] || 0) < 3000) {
      console.log(`Cancel order ignored for user ${userId} on order ${orderId}: Duplicate request within 3 seconds`);
      return { success: false, message: 'Duplicate request within 3 seconds' };
    }

    if (this.isCancelOrderProcessing[userId][orderId]) {
      console.log(`Cancel order ignored for user ${userId} on order ${orderId}: Another cancel request is being processed`);
      return { success: false, message: 'Another cancel request is being processed' };
    }

    this.isCancelOrderProcessing[userId][orderId] = true;
    this.lastCancelOrderTime[userId][orderId] = currentTime;

    try {
      const client = new USDMClient({ api_key: apiKey, api_secret: apiSecret, recvWindow: 4000,});
      await client.cancelOrder({ symbol, orderId });
      await this.updateEntryCounts(userId, symbol, brokerAccountName);

      console.log(`Open order canceled: ${symbol}, OrderId: ${orderId}`);
      return { success: true, message: `${symbol} open order cancelled successfully`, orderId: orderId.toString() };
    } catch (error) {
      console.error('Error canceling order:', error);
      return { success: false, message: `Failed to cancel order: ${error.message}` };
    } finally {
      this.isCancelOrderProcessing[userId][orderId] = false;
      setTimeout(() => {
        delete this.lastCancelOrderTime[userId][orderId];
        delete this.isCancelOrderProcessing[userId][orderId];
      }, 4000);
    }
  }





  // Close Position
  async closePosition(
    userId: string,
    apiKey: string,
    apiSecret: string,
    brokerAccountName: string,
    orderData: OrderData,
  ): Promise<{ success: boolean; message: string }> {
    const { symbol, positionAmt, side, updateTime } = orderData;
    if (!symbol || !positionAmt || !side || !updateTime) {
      console.error('Validation error: Symbol, positionAmt, side, and updateTime are required');
      return { success: false, message: 'Symbol, positionAmt, side, and updateTime are required' };
    }

    const currentTime = Date.now();
    this.lastOrderTimeByUserAndSymbol[userId] = this.lastOrderTimeByUserAndSymbol[userId] || {};
    this.isProcessingOrderByUserAndSymbol[userId] = this.isProcessingOrderByUserAndSymbol[userId] || {};

    if (currentTime - (this.lastOrderTimeByUserAndSymbol[userId][symbol] || 0) < 3000) {
      console.log(`Close position ignored for user ${userId} on symbol ${symbol}: Duplicate request within 3 seconds`);
      return { success: false, message: 'Duplicate request within 3 seconds' };
    }

    if (this.isProcessingOrderByUserAndSymbol[userId][symbol]) {
      console.log(`Close position ignored for user ${userId} on symbol ${symbol}: Another order is being processed`);
      return { success: false, message: 'Another order is being processed' };
    }

    this.isProcessingOrderByUserAndSymbol[userId][symbol] = true;
    this.lastOrderTimeByUserAndSymbol[userId][symbol] = currentTime;

    try {
      const client = new USDMClient({ api_key: apiKey, api_secret: apiSecret , recvWindow: 4000,});
      if (!this.existingSubbroker) {
        console.error('Subbroker not initialized');
        return { success: false, message: 'Subbroker not initialized' };
      }

        const newOrder = {
          symbol,
          side,
          type: 'MARKET' as FuturesOrderType,
          quantity: Math.abs(positionAmt),
        };

        await client.submitNewOrder(newOrder);
        await this.updateEntryCounts(userId, symbol, brokerAccountName);

        console.log(`Closed position for ${symbol}`);
        return { success: true, message: `${symbol} Position closed successfully` };
     
    } catch (error) {
      console.error('Error closing position:', error);
      return { success: false, message: `Failed to close position: ${error.message}` };
    } finally {
      this.isProcessingOrderByUserAndSymbol[userId][symbol] = false;
      setTimeout(() => {
        delete this.lastOrderTimeByUserAndSymbol[userId][symbol];
        delete this.isProcessingOrderByUserAndSymbol[userId][symbol];
      }, 4000);
    }
  }




  // Get Positions
  async getPositions(userId: string, apiKey: string, apiSecret: string): Promise<any> {
    try {
      const client = new USDMClient({ api_key: apiKey, api_secret: apiSecret,recvWindow:4000 });
      const data = await client.getPositionsV3();
      const filteredPositions = Array.isArray(data)
        ? data.filter((position) => !/^0+(\.0+)?$/.test(String(position.positionAmt)))
        : [];

      const response = {
        positions: filteredPositions,
        message: filteredPositions.length === 0 ? 'No open positions available' : undefined,
      };

      if (this.existingSubbroker && this.existingSubbroker.future) {
        response['dailyEntryCount'] = this.existingSubbroker.future.DailyEntryCount;
        response['symbolCounts'] = this.existingSubbroker.future.SpecificSymbolCount.map((sc) => ({
          symbolname: sc.symbolname,
          number: sc.number,
        }));
      }

      console.log(`Fetched positions for user ${userId}:`, response);
      return response;
    } catch (error) {
      console.error('Error fetching positions:', error);
      return { message: `Failed to fetch positions: ${error.message}` };
    }
  }





  // Get Stop and Target Data
  async getStopAndTargetData(orderData: OrderData): Promise<any> {
    const { clientId, orderId } = orderData;
    if (!clientId || !orderId) {
      console.error('Validation error: clientId and orderId are required');
      return { message: 'clientId and orderId are required' };
    }

    try {
      const orders = await this.orderModel.find({ clientId });
      if (!orders || orders.length === 0) {
        console.log(`No orders found for clientId: ${clientId}`);
        return { message: 'No orders found for client ID' };
      }

      const order = orders.find((o) => o.orderId.toString() === orderId.toString());
      if (!order) {
        console.log(`No matching order found for orderId: ${orderId}`);
        return { message: 'No matching order found' };
      }

      const riskFactorPercent = (order.riskFactor * 100).toFixed(2);
      const response = {
        symbol: order.symbol,
        stopLossPrice: order.stopLossPrice,
        takeProfitPrice: order.takeProfitPrice,
        riskFactor: riskFactorPercent,
      };

      console.log(`Fetched stop and target data for order ${orderId}:`, response);
      return response;
    } catch (error) {
      console.error('Error retrieving stop and target data:', error);
      return { message: `Failed to retrieve stop and target data: ${error.message}` };
    }
  }


/*

  // Modify Stop Loss and Target
  async modifyStopLossAndTarget(
    userId: string,
    apiKey: string,
    apiSecret: string,
    brokerAccountName: string,
    orderData: OrderData,
  ): Promise<any> {
    const { symbol, orderId, positionAmt, side, orderType, cancel, oldStopLoss, lastUpdate, price } = orderData;
    if (!symbol || !orderId || !positionAmt || !side || !orderType || !lastUpdate || !price) {
      console.error('Validation error: Required fields missing');
      return { success: false, message: 'Symbol, orderId, positionAmt, side, orderType, lastUpdate, and price are required' };
    }

    const currentTime = Date.now();
    this.lastModifyOrderTime[userId] = this.lastModifyOrderTime[userId] || {};
    this.isModifyOrderProcessing[userId] = this.isModifyOrderProcessing[userId] || {};

    if (currentTime - (this.lastModifyOrderTime[userId][symbol] || 0) < 3000) {
      console.log(`Modify order ignored for user ${userId} on symbol ${symbol}: Duplicate request within 3 seconds`);
      return { success: false, message: 'Duplicate request within 3 seconds' };
    }

    if (this.isModifyOrderProcessing[userId][symbol]) {
      console.log(`Modify order ignored for user ${userId} on symbol ${symbol}: Another modify order is being processed`);
      return { success: false, message: 'Another modify order is being processed' };
    }

    this.isModifyOrderProcessing[userId][symbol] = true;
    this.lastModifyOrderTime[userId][symbol] = currentTime;

    try {
      const client = new USDMClient({ api_key: apiKey, api_secret: apiSecret, recvWindow:4000 });
      if (!this.existingSubbroker) {
        console.error('Subbroker not initialized');
        return { success: false, message: 'Subbroker not initialized' };
      }

    
     
        let entercorrect = false;
        const marketPrice = await this.getMarketPrice(symbol);

        if (orderType === 'STOP_MARKET') {
          if (
            (side === 'SELL' && price > oldStopLoss && price < marketPrice) ||
            (side === 'BUY' && price < oldStopLoss && price > marketPrice)
          ) {
            entercorrect = true;
          } else {
            console.log(`Invalid stop-loss price for ${symbol}`);
            return {
              success: false,
              message: `StopLossPrice should be ${side === 'SELL' ? 'greater' : 'less'} than last stoploss price and ${
                side === 'SELL' ? 'less' : 'greater'
              } than market price of ${symbol}`,
            };
          }
        } else if (orderType === 'TAKE_PROFIT_MARKET') {
          if ((side === 'SELL' && price > marketPrice) || (side === 'BUY' && price < marketPrice)) {
            entercorrect = true;
          } else {
            console.log(`Invalid target price for ${symbol}`);
            return {
              success: false,
              message: `Target price should be ${side === 'SELL' ? 'greater' : 'less'} than market price of ${symbol}`,
            };
          }
        }

        if (entercorrect) {
          const newOrder = {
            positionSide: 'BOTH',
            priceProtect: 'TRUE',
            symbol,
            side,
            type: orderType,
            stopPrice: price,
            timeInForce: 'GTE_GTC',
            workingType: 'MARK_PRICE',
            quantity: Math.abs(positionAmt),
            closePositon: 'TRUE',
          };

          const order = await client.submitNewOrder(newOrder);
          console.log(`Modified order for ${symbol}:`, order);

          if (cancel === 'yes') {
            await client.cancelOrder({ symbol, orderId: [orderId] });
            console.log(`Canceled old order for ${symbol}: ${orderId}`);
          }

          if (orderData.userName) {
            await this.getAnd(
              orderData.userName,
              apiKey,
              apiSecret,
              orderData.ipAddress || 'defaultIp',
              orderData.httpPort || 3030,
              orderData.ipUsername || 'defaultUser',
              orderData.ipPassword || 'defaultPass',
              symbol,
              order.orderId,
              price,
              price, // Assuming same price for simplicity
              positionAmt.toString(),
              side,
              orderData.riskFactor || 1,
            );
            console.log(`Called getAnd for modified order: ${symbol}`);
          }

          return {
            success: true,
            message: 'Modify order successful',
            orderId: order.orderId.toString(),
          };
        }
      }

      console.log(`Modify order denied for ${symbol}: Time gap not met`);
      return {
        success: false,
        message: `A minimum gap is required. You can modify order after ${timeNeeded} minutes`,
      };
    } catch (error) {
      console.error('Error modifying stop/target:', error);
      return { success: false, message: `Failed to modify stop/target: ${error.message}` };
    } finally {
      this.isModifyOrderProcessing[userId][symbol] = false;
      setTimeout(() => {
        delete this.lastModifyOrderTime[userId][symbol];
        delete this.isModifyOrderProcessing[userId][symbol];
      }, 4000);
    }


*/


  }

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OrderSide, MarginType, USDMClient, NewFuturesOrderParams } from 'binance';
import { get } from './5-binance-check-pending-orders';
import { CheckPendingDocument, CheckPendingType } from './8-binace-check-pending-order.schema';
import { EntryCountDocument, EntryCountType } from './10-binance-future-entry-count-schema';
import { Model } from 'mongoose';

interface OrderData {
  symbol: string;
  side: OrderSide;
  type: 'MARKET' | 'LIMIT' | 'STOP_MARKET' | 'TAKE_PROFIT_MARKET';
  orderPlacingType: string;
  marginTypes?: MarginType;
  maxLeverage?: number;
  maxRiskPercentage: number;
  entryPrice?: number;
  stopLoss?: number;
  targetPrice?: number;
  orderId?: number;
  userName?: string;
  ipAddress?: string;
  httpPort?: number;
  ipUsername?: string;
  ipPassword?: string;
  riskFactor?: number;
  existingSubbroker?: string;
}

@Injectable()
export class BinancePlaceOrderService {
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

  constructor(
    @InjectModel(CheckPendingType.name) private orderModel: Model<CheckPendingDocument>,
    @InjectModel(EntryCountType.name) private entryCountModel: Model<EntryCountDocument>,
  ) {
    this.getAnd = get(this.orderModel).getAnd;
  }

  private async updateEntryCounts(userId: string, symbol: string, subbroker?: string): Promise<void> {
    try {
      const today = new Date();

      const updateFields: any = {
        $inc: {
          totalDailyEntryCount: 1,
          [`symbolCounts.${symbol}`]: 1,
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

      console.log(`Updated entry counts for user ${userId}:`, {
        totalDailyEntryCount: entryCount.totalDailyEntryCount,
        symbolCounts: entryCount.symbolCounts,
      });
    } catch (error) {
      console.error('Error updating entry counts:', error);
    }
  }

  private async validateOrderData(orderData: OrderData): Promise<string | null> {
    if (!orderData.symbol) return 'Symbol is required';
    if (!orderData.side) return 'Order side is required';
    if (!orderData.type) return 'Order type is required';
    if (!orderData.maxRiskPercentage || orderData.maxRiskPercentage <= 0) {
      return 'Invalid risk percentage';
    }
    if (orderData.maxLeverage && orderData.maxLeverage <= 0) {
      return 'Invalid leverage value';
    }
    if (orderData.stopLoss === undefined && orderData.type === 'MARKET') {
      return 'Stop-loss price is required for market orders';
    }
    if (orderData.targetPrice === undefined && orderData.type === 'MARKET') {
      return 'Target price is required for market orders';
    }
    return null;
  }

  async placeFutureNewOrder(
    userId: string,
    apiKey: string,
    apiSecret: string,
    brokerAccountName:string,
    orderData: OrderData,
  ): Promise<{ success: boolean; message: string; orderId?: string }> {
    console.log(`Processing order for user ${userId}`, orderData);

    const validationError = await this.validateOrderData(orderData);
    if (validationError) {
      console.error('Validation error:', validationError);
      return { success: false, message: validationError };
    }

    const client = new USDMClient({
      api_key: apiKey,
      api_secret: apiSecret,
    });

    try {
      if (orderData.maxLeverage) {
        try {
          await client.setLeverage({
            symbol: orderData.symbol,
            leverage: orderData.maxLeverage,
          });
          console.log('Leverage set:', { symbol: orderData.symbol, leverage: orderData.maxLeverage });
        } catch (error) {
          console.error('Failed to set leverage:', error);
          return { success: false, message: `Failed to set leverage: ${error.message}` };
        }
      }

      if (orderData.marginTypes) {
        try {
          await client.setMarginType({
            symbol: orderData.symbol,
            marginType: orderData.marginTypes,
          });
          console.log('Margin type set:', { symbol: orderData.symbol, marginType: orderData.marginTypes });
        } catch (error) {
          console.error('Failed to set margin type, continuing execution:', error);
        }
      }

      const positionsData = await client.getPositionsV3();
      const positions = Array.isArray(positionsData)
        ? positionsData.filter((pos) => parseFloat(String(pos.positionAmt)) !== 0)
        : [];
      const openOrdersData = await client.getAllOpenOrders();
      const openOrders = Array.isArray(openOrdersData) ? openOrdersData : [];

      const symbolPosition = positions.find((pos) => pos.symbol === orderData.symbol);
      if (symbolPosition) {
        const positionAmt = parseFloat(String(symbolPosition.positionAmt));
        if (
          (positionAmt > 0 && orderData.side === 'SELL') ||
          (positionAmt < 0 && orderData.side === 'BUY')
        ) {
          console.log('Opposite side position detected');
          return {
            success: false,
            message: 'Opposite side order denied due to existing position',
          };
        }
      }

      const gtcOrders = openOrders.filter(
        (order) => order.symbol === orderData.symbol && order.timeInForce === 'GTC',
      );
      if (gtcOrders.some((order) => order.side !== orderData.side)) {
        console.log('Opposite side GTC order detected');
        return {
          success: false,
          message: `Opposite side GTC order exists for ${orderData.symbol}`,
        };
      }

      const gteGtcOrders = openOrders.filter(
        (order) => order.symbol === orderData.symbol && (order.timeInForce === 'GTE_GTC') || (order.timeInForce === 'GTC'),
        console.log("tjgjjh",orderData.symbol, ),
      );
      if (orderData.symbol && orderData.orderId) {
        if (gteGtcOrders.length >= 8) {
          console.log('Max open orders reached',gteGtcOrders);
          return {
            success: false,
            message: `Maximum 8 open orders reached for ${orderData.symbol}`,
          };
        }
      } else {
        if (gteGtcOrders.length >= 7) {
          console.log('Max open orders reached',gteGtcOrders);
          return {
            success: false,
            message: `Maximum 8 open orders reached for ${orderData.symbol}`,
          };
        }
      }
    

      const accountInfo = await client.getBalanceV3();
      const usdtBalance = Number(accountInfo.find((asset) => asset.asset === 'USDT')?.availableBalance ?? 0);
      if (usdtBalance <= 0) {
        console.log('Insufficient balance');
        return { success: false, message: 'Insufficient USDT balance' };
      }

      const markPrice = Number((await client.getMarkPrice({ symbol: orderData.symbol })).markPrice);
      const entryPrice = Number(orderData.entryPrice ?? markPrice);
      if (!entryPrice) {
        console.log('No entry price');
        return { success: false, message: 'Unable to determine entry price' };
      }

      const riskFactor = orderData.maxRiskPercentage / 100;
      const stopLossPrice = Number(orderData.stopLoss);
      const priceDifference =
        orderData.orderPlacingType === 'LIMIT' ||
        orderData.orderPlacingType === 'STOP_MARKET' ||
        orderData.orderPlacingType === 'TAKE_PROFIT_MARKET'
          ? entryPrice - stopLossPrice
          : markPrice - stopLossPrice;

      const rawQuantity = Math.abs((usdtBalance * riskFactor) / priceDifference);
      const quantity = rawQuantity < 1 ? rawQuantity.toFixed(3) : Math.round(rawQuantity).toString();

      const targetPrice = Number(orderData.targetPrice);
      if (
        ((markPrice && Number(quantity) * markPrice <= 5) ||
         (entryPrice && Number(quantity) * entryPrice <= 5)) &&
        (Number(quantity) * stopLossPrice <= 5 || Number(quantity) * targetPrice <= 5)
      ) {
        const errorMessage = `Notional value too low: Quantity=${quantity}`;
        console.log('Notional value validation failed:', errorMessage);
        return { success: false, message: errorMessage };
      }

      if (orderData.orderPlacingType === 'MARKET') {
        const newOrder: NewFuturesOrderParams<number> = {
          symbol: orderData.symbol,
          side: orderData.side,
          type: 'MARKET',
          quantity: Number(quantity),
        };

        let orderStatusChanged = false;
        let orderStatusCheckInterval: NodeJS.Timeout | null = null;

        try {
          const order = await client.submitNewOrder(newOrder);
          const symbol = order.symbol;
          const orderId = order.orderId;
          console.log('Market order submitted:', { symbol, orderId });

          // Update entry counts
       
          let checkProcessOrdersExecuted = false;
          let mainExecuted = false;

          orderStatusCheckInterval = setInterval(async () => {
            try {
              const orderDetails = await client.getOrder({
                symbol: symbol,
                orderId: orderId,
              });

              if (orderDetails.status !== 'NEW' && !orderStatusChanged) {
                orderStatusChanged = true;
                if (orderStatusCheckInterval) clearInterval(orderStatusCheckInterval);

                if (orderDetails.status === 'FILLED') {
                  console.log('Market order filled:', orderDetails);

                  await this.updateEntryCounts(userId, symbol, brokerAccountName);
                  if (!mainExecuted) {
                    console.log('Checking USDT balance (placeholder)');
                    await this.placeStopLossAndTakeProfit(
                      client,
                      symbol,
                      orderData.side,
                      stopLossPrice,
                      targetPrice,
                      quantity,
                    );
                    mainExecuted = true;
                    //extra pending order
                    if (orderData.symbol && orderData.orderId) {
                      try {
                        await client.cancelOrder({
                          symbol: orderData.symbol,
                          orderId: orderData.orderId,
                        });
                        console.log('Pending order canceled:', {
                          symbol: orderData.orderId,
                          orderId: orderData.orderId,
                        });
                      } catch (error) {
                        console.error('Failed to cancel pending order:', error);
                      }
                    }
                    if (orderData.existingSubbroker) {
                      console.log('Incrementing symbol count for subbroker:', {
                        subbroker: orderData.existingSubbroker,
                        symbol,
                      });
                    }

                    setTimeout(async () => {
                      if (!checkProcessOrdersExecuted) {
                        await this.checkProcessOrders(client, symbol, Number(quantity), orderData.side);
                        checkProcessOrdersExecuted = true;
                        mainExecuted = false;
                      }
                    }, 5000);
                  }
                } else if (orderDetails.status === 'CANCELED') {
                  console.log('Market order canceled:', orderDetails);
                  orderStatusChanged = true;
                  if (orderStatusCheckInterval) clearInterval(orderStatusCheckInterval);
                  return {
                    success: false,
                    message: 'Market order was canceled',
                    orderId: orderId.toString(),
                  };
                }
              } else {
                orderStatusChanged = true;
                if (orderStatusCheckInterval) clearInterval(orderStatusCheckInterval);
              }
            } catch (error) {
              if (
                error.code === '-2013' ||
                error.message.includes('Order does not exist')
              ) {
                console.log('Order filled or canceled:', error);
                orderStatusChanged = true;
                if (orderStatusCheckInterval) clearInterval(orderStatusCheckInterval);
                await this.placeStopLossAndTakeProfit(
                  client,
                  symbol,
                  orderData.side,
                  stopLossPrice,
                  targetPrice,
                  quantity,
                );
                setTimeout(async () => {
                  if (!checkProcessOrdersExecuted) {
                    await this.checkProcessOrders(client, symbol, Number(quantity), orderData.side);
                    checkProcessOrdersExecuted = true;
                    mainExecuted = false;
                  }
                }, 6000);
              } else {
                console.error('Binance error checking order status:', error);
                orderStatusChanged = true;
                if (orderStatusCheckInterval) clearInterval(orderStatusCheckInterval);
                await this.placeStopLossAndTakeProfit(
                  client,
                  symbol,
                  orderData.side,
                  stopLossPrice,
                  targetPrice,
                  quantity,
                );
                setTimeout(async () => {
                  if (!checkProcessOrdersExecuted) {
                    await this.checkProcessOrders(client, symbol, Number(quantity), orderData.side);
                    checkProcessOrdersExecuted = true;
                    mainExecuted = false;
                  }
                }, 7000);
                return {
                  success: false,
                  message: `Binance error: ${error.message}`,
                  orderId: orderId.toString(),
                };
              }
            }
          }, 700);

          if (orderData.riskFactor) {
            console.log('Calling getAnd (placeholder):', {
              userName: 'satishlute',
              apiKey,
              apiSecret,
              ipAddress: '57767777',
              httpPort: 3050,
              ipUsername: 'satish',
              ipPassword: 'fgffgggg',
              symbol,
              orderId,
              stopLossPrice,
              targetPrice,
              quantity,
              side: orderData.side,
              riskFactor: orderData.riskFactor,
            });
          }

          return {
            success: true,
            message: 'Market order placed and being monitored',
            orderId: orderId.toString(),
          };
        } catch (error) {
          console.error('Error submitting market order:', error);
          orderStatusChanged = true;
          if (orderStatusCheckInterval) clearInterval(orderStatusCheckInterval);
          return {
            success: false,
            message: `Failed to submit market order: ${error.message}`,
          };
        }
      } else {
        let newOrder: NewFuturesOrderParams<number>;

        if (orderData.orderPlacingType === 'LIMIT') {
          if (!orderData.entryPrice) {
            return { success: false, message: 'Entry price required for LIMIT order' };
          }
          newOrder = {
            symbol: orderData.symbol,
            side: orderData.side,
            type: 'LIMIT',
            timeInForce: 'GTC',
            price: orderData.entryPrice,
            quantity: Number(quantity),
          };
        } else if (orderData.orderPlacingType === 'STOP_MARKET') {
          if (!orderData.entryPrice) {
            return { success: false, message: 'Stop price required for STOP_MARKET order' };
          }
          newOrder = {
            symbol:orderData.symbol,
            side: orderData.side,
            type: 'STOP_MARKET',
            timeInForce: 'GTC',
            stopPrice: orderData.entryPrice,
            quantity: Number(quantity),
          };
        } else if (orderData.orderPlacingType === 'TAKE_PROFIT_MARKET') {
          if (!orderData.entryPrice) {
            return { success: false, message: 'Stop price required for TAKE_PROFIT_MARKET order' };
          }
          newOrder = {
            symbol: orderData.symbol,
            side: orderData.side,
            type: 'TAKE_PROFIT_MARKET',
            timeInForce: 'GTC',
            stopPrice: orderData.entryPrice,
            quantity: Number(quantity),
          };
        } else {
          return { success: false, message: 'Unsupported order type' };
        }

        try {
          const order = await client.submitNewOrder(newOrder);
          console.log('Pending order submitted:', { symbol: order.symbol, orderId: order.orderId });

          // Update entry counts
          await this.updateEntryCounts(userId, order.symbol, brokerAccountName);

          if (orderData.symbol && orderData.orderId) {
            try {
              await client.cancelOrder({
                symbol: orderData.symbol,
                orderId: orderData.orderId,
              });
              console.log('Pending order canceled:', {
                symbol: orderData.orderId,
                orderId: orderData.orderId,
              });
            } catch (error) {
              console.error('Failed to cancel pending order:', error);
            }
          }

          if (orderData) {
            console.log('Calling getAnd:', {
              Name: orderData.userName || 'defaultUser',
              apiKey,
              apiSecret,
              ipAddress: orderData.ipAddress || '66676867878',
              httpPort: orderData.httpPort || 3030,
              ipUsername: orderData.ipUsername || 'gtgftgtg',
              ipPassword: orderData.ipPassword || 'gtgffhgjhggg',
              symbol: order.symbol,
              orderId: order.orderId,
              stopLossPrice,
              targetPrice,
              quantity,
              side: orderData.side,
              riskFactor: 1,
            });
            await this.getAnd(
              orderData.userName || 'defaultUser',
              apiKey,
              apiSecret,
              orderData.ipAddress || '66676867878',
              orderData.httpPort || 3030,
              orderData.ipUsername || 'gtgftgtg',
              orderData.ipPassword || 'gtgffhgjhggg',
              order.symbol,
              order.orderId,
              stopLossPrice,
              targetPrice,
              quantity,
              orderData.side,
              orderData.riskFactor || 1,
            );
          }

          return {
            success: true,
            message: `Pending order successfully for ${order.symbol}`,
            orderId: order.orderId.toString(),
          };
        } catch (error) {
          console.error('Error submitting non-market order:', error);
          return {
            success: false,
            message: `Failed to submit order: ${error.message}`,
          };
        }
      }
    } catch (error) {
      console.error('Error in placeFutureNewOrder:', error);
      return {
        success: false,
        message: `Error processing order: ${error.message}`,
      };
    }
  }

  private async placeStopLossAndTakeProfit(
    client: USDMClient,
    symbol: string,
    side: OrderSide,
    stopLossPrice: number,
    takeProfitPrice: number,
    quantity: string,
  ): Promise<void> {
    try {
      const newStopOrder: NewFuturesOrderParams<number> = {
        positionSide: 'BOTH',
        priceProtect: 'TRUE',
        symbol: symbol,
        side: side === 'BUY' ? 'SELL' : 'BUY',
        type: 'STOP_MARKET',
        stopPrice: stopLossPrice,
        timeInForce: 'GTE_GTC',
        workingType: 'MARK_PRICE',
        quantity: parseFloat(quantity),
        reduceOnly: 'false',
      };

      await client.submitNewOrder(newStopOrder);
      console.log('Stop-loss order submitted successfully:', { symbol, stopPrice: stopLossPrice });

      const newTargetOrder: NewFuturesOrderParams<number> = {
        positionSide: 'BOTH',
        priceProtect: 'TRUE',
        symbol: symbol,
        side: side === 'BUY' ? 'SELL' : 'BUY',
        type: 'TAKE_PROFIT_MARKET',
        stopPrice: takeProfitPrice,
        timeInForce: 'GTE_GTC',
        workingType: 'MARK_PRICE',
        quantity: parseFloat(quantity),
        reduceOnly: 'false',
      };
      await client.submitNewOrder(newTargetOrder);
      console.log('Take-profit order submitted successfully:', { symbol, stopPrice: takeProfitPrice });
    } catch (error) {
      console.error('Error placing stop-loss or take-profit order:', error);
      throw error;
    }
  }

  private async checkProcessOrders(
    client: USDMClient,
    symbol: string,
    quantity: number,
    side: OrderSide,
  ): Promise<void> {
    try {
      console.log('Starting checkProcessOrders for symbol:', symbol);
      const positionsData = await client.getPositionsV3();
      const positions = Array.isArray(positionsData)
        ? positionsData.filter((position) => !/^0+(.0+)?$/.test(String(position.positionAmt)))
        : [];
      const openOrdersData = await client.getAllOpenOrders();
      const openOrders = Array.isArray(openOrdersData)
        ? openOrdersData.filter((order) => !/^0+(.0+)?$/.test(String(order.orderId)))
        : [];

      for (const position of positions) {
        if (position.symbol !== symbol) continue;

        try {
          const positionQuantity = Math.abs(parseFloat(String(position.positionAmt)));
          const getside = parseFloat(String(position.positionAmt));
          console.log(`Processing symbol: ${symbol}, Position Quantity: ${positionQuantity}`);

          const matchingStopMarketOrders = openOrders.filter(
            (order) => order.symbol === symbol && order.timeInForce === 'GTE_GTC' && order.type === 'STOP_MARKET',
          );
          const matchingTakeProfitOrders = openOrders.filter(
            (order) => order.symbol === symbol && order.timeInForce === 'GTE_GTC' && order.type === 'TAKE_PROFIT_MARKET',
          );

          const totalStopMarketQuantity = matchingStopMarketOrders.reduce(
            (total, order) => total + Math.abs(parseFloat(String(order.origQty))),
            0,
          );
          const totalTakeProfitQuantity = matchingTakeProfitOrders.reduce(
            (total, order) => total + Math.abs(parseFloat(String(order.origQty))),
            0,
          );

          if (matchingStopMarketOrders.length === 0 || matchingTakeProfitOrders.length === 0) {
            console.log(`Symbol: ${symbol}, Position Quantity: ${positionQuantity}`);
            console.log('No open orders (Stop Market or Take Profit) available for this symbol.');
            const closeSide = getside > 0 ? 'SELL' : 'BUY';
            const positionsDataCheck = await client.getPositionsV3();
            const positionsCheck = Array.isArray(positionsDataCheck)
              ? positionsDataCheck.filter((position) => !/^0+(.0+)?$/.test(String(position.positionAmt)))
              : [];
            const currentPosition = positionsCheck.find((pos) => pos.symbol === symbol);

            if (currentPosition) {
              const newOrder: NewFuturesOrderParams<number> = {
                symbol: symbol,
                side: closeSide as OrderSide,
                type: 'MARKET',
                quantity: positionQuantity,
              };

              await client.submitNewOrder(newOrder);
              console.log(`Closed position for ${symbol}: ${JSON.stringify(newOrder)}`);
            }
          } else {
            if (totalStopMarketQuantity !== totalTakeProfitQuantity) {
              console.log(
                `Quantity mismatch for ${symbol}: Stop Market (${totalStopMarketQuantity}) vs Take Profit (${totalTakeProfitQuantity})`,
              );
            }

            if (positionQuantity < totalStopMarketQuantity || positionQuantity < totalTakeProfitQuantity) {
              console.log(
                `Position Quantity (${positionQuantity}) is less than Stop Market (${totalStopMarketQuantity}) or Take Profit (${totalTakeProfitQuantity}) orders.`,
              );
            }

            if (positionQuantity > totalStopMarketQuantity || positionQuantity > totalTakeProfitQuantity) {
              const extraQuantity = positionQuantity - Math.min(totalStopMarketQuantity, totalTakeProfitQuantity);
              const closeSide = getside > 0 ? 'SELL' : 'BUY';
              const positionsDataCheck = await client.getPositionsV3();
              const positionsCheck = Array.isArray(positionsDataCheck)
                ? positionsDataCheck.filter((position) => !/^0+(.0+)?$/.test(String(position.positionAmt)))
                : [];
              const currentPosition = positionsCheck.find((pos) => pos.symbol === symbol);

              if (currentPosition) {
                const newOrder: NewFuturesOrderParams<number> = {
                  symbol: symbol,
                  side: closeSide as OrderSide,
                  type: 'MARKET',
                  quantity: extraQuantity,
                };

                await client.submitNewOrder(newOrder);
                console.log(`Closed extra position for ${symbol}: ${JSON.stringify(newOrder)}`);
              }
            }
          }
        } catch (error) {
          console.error(`Error processing position for symbol ${symbol}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in checkProcessOrders:', error);
      throw error;
    }
  }
}
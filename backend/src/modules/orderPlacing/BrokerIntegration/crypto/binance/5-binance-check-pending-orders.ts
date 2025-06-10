import { Model } from 'mongoose';
import { USDMClient, OrderSide, NewFuturesOrderParams } from 'binance';
import { CheckPendingDocument, CheckPendingType } from './8-binace-check-pending-order.schema';

// Interface for client data stored in orderplacingdata Map
interface ClientData {
  clientId: string;
  api_key: string;
  api_secret: string;
  ipAddress: string;
  httpPort: number;
  ipUsername: string;
  ipPassword: string;
  symbol: string;
  orderId: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  quantity: string;
  side: OrderSide;
  riskFactor: number;
  newclient: USDMClient;
  statusChanged: boolean;
  intervalId: NodeJS.Timeout | null;
}

// Global state (consider replacing with MongoDB or Redis in production)
let orderplacingdata: Map<string, ClientData> = new Map();

// Export the get function
export function get(Order: Model<CheckPendingDocument>) {
  async function loadOrdersFromDatabase(): Promise<void> {
    try {
      const orders = await Order.find({}).exec();
      for (const order of orders) {
        const { api_key, api_secret, ipAddress, httpPort, ipUsername, ipPassword } = order;
        const newclient = new USDMClient({
          api_key,
          api_secret,
          recvWindow: 4000,
        });

        orderplacingdata.set(order.clientId, {
          clientId: order.clientId,
          api_key,
          api_secret,
          ipAddress,
          httpPort,
          ipUsername,
          ipPassword,
          symbol: order.symbol,
          orderId: order.orderId,
          stopLossPrice: order.stopLossPrice,
          takeProfitPrice: order.takeProfitPrice,
          quantity: order.quantity,
          side: order.side as OrderSide,
          riskFactor: order.riskFactor,
          newclient,
          statusChanged: false,
          intervalId: null,
        });

        await startCheckingOrders(order.clientId);
      }

      console.log('Orders loaded from database:', orders.length);
    } catch (error) {
      console.error('Error loading orders from database:', error);
      throw new Error(`Failed to load orders: ${error.message}`);
    }
  }

  // Lazy-load orders on first call (avoid module-load issues)
  let isLoaded = false;
  async function ensureOrdersLoaded(): Promise<void> {
    if (!isLoaded) {
      await loadOrdersFromDatabase();
      isLoaded = true;
    }
  }

  async function getAnd(
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
  ): Promise<void> {
    await ensureOrdersLoaded();

    if (
      !Name ||
      !api_key ||
      !api_secret ||
      !ipAddress ||
      !httpPort ||
      !ipUsername ||
      !ipPassword ||
      !symbol ||
      !orderId ||
      !stopLossPrice ||
      !takeProfitPrice ||
      !quantity ||
      !side ||
      !riskFactor
    ) {
      const error = new Error('Missing required parameters');
      console.error(error.message, { Name, symbol, orderId });
      throw error;
    }

    console.log('Received order data:', )
    const clientId = `${Name}_${orderId}`;
    const orderData: Partial<CheckPendingDocument> = {
      clientId,
      api_key,
      api_secret,
      ipAddress,
      httpPort,
      ipUsername,
      ipPassword,
      symbol,
      orderId,
      stopLossPrice,
      takeProfitPrice,
      quantity,
      side,
      riskFactor,
    };

    const newclient = new USDMClient({
      api_key,
      api_secret,
      recvWindow: 4000,
    });

    if (!clientId) {
      throw new Error('clientId is undefined');
    }

    if (!orderData.api_key || !orderData.api_secret || !orderData.ipAddress || !orderData.ipUsername || !orderData.ipPassword || !orderData.symbol || !orderData.quantity || !orderData.side) {
      throw new Error('Missing required order data fields');
    }

    orderplacingdata.set(clientId, {
      clientId,
      api_key: orderData.api_key,
      api_secret: orderData.api_secret,
      ipAddress: orderData.ipAddress,
      httpPort: orderData.httpPort || 0,
      ipUsername: orderData.ipUsername,
      ipPassword: orderData.ipPassword,
      symbol: orderData.symbol,
      orderId: orderData.orderId || 0,
      stopLossPrice: orderData.stopLossPrice || 0,
      takeProfitPrice: orderData.takeProfitPrice || 0,
      quantity: orderData.quantity,
      side: orderData.side as OrderSide,
      riskFactor: orderData.riskFactor || 0,
      newclient,
      statusChanged: false,
      intervalId: null,
    });

    try {
      await Order.findOneAndUpdate({ clientId }, { $set: orderData }, { upsert: true, new: true }).exec();
      console.log('Stored data for clientId:', clientId);
    } catch (error) {
      console.error('Error saving order data to database:', error);
      throw new Error(`Failed to save order for clientId ${clientId}: ${error.message}`);
    }

    await startCheckingOrders(clientId);
  }

  async function startCheckingOrders(clientId: string): Promise<void> {
    const clientData = orderplacingdata.get(clientId);
    if (!clientData) {
      const error = new Error('No data found for clientId');
      console.error(error.message, { clientId });
      throw error;
    }

    if (clientData.intervalId === null) {
      const intervalId = setInterval(async () => {
        const { newclient, symbol, orderId, statusChanged } = clientData;
        try {
          const order = await newclient.getOrder({ symbol, orderId });
         // console.log('Order status for clientId:', clientId, order);

          if (order.status !== 'NEW' && !statusChanged) {
            clientData.statusChanged = true;
            clearInterval(intervalId);
            clientData.intervalId = null;
            orderplacingdata.set(clientId, clientData);

            if (order.status === 'FILLED') {
              console.log('Order executed for clientId:', clientId, order);
              await mainx(clientId);

              setTimeout(() => {
                checkProcessOrders(newclient);
              }, 4000);
            } else if (order.status === 'CANCELED' || order.status === 'EXPIRED') {
              console.log('Order canceled or expired for clientId:', clientId);
              await Order.deleteOne({ clientId }).exec();
              orderplacingdata.delete(clientId);
            }
          }
        } catch (error: any) {
          if (error.code === '-2013' || error.message.includes('Order does not exist')) {
            console.log('Order filled or canceled for:', clientId);
            clientData.statusChanged = true;
            clearInterval(intervalId);
            clientData.intervalId = null;
            orderplacingdata.set(clientId, clientData);

            await mainx(clientId);
            setTimeout(() => {
              checkProcessOrders(newclient);
            }, 6000);
          } else {
            console.error('Binance error checking order status:', clientId, error);
            clientData.statusChanged = true;
            clearInterval(intervalId);
            clientData.intervalId = null;
            orderplacingdata.set(clientId, clientData);
            throw new Error(`Failed to check order status for clientId ${clientId}: ${error.message}`);
          }
        }
      }, 800);

      clientData.intervalId = intervalId;
      orderplacingdata.set(clientId, clientData);
    } else {
      console.log(`Already checking orders for clientId ${clientId}`);
    }
  }

  async function clearCheckingOrders(clientId: string): Promise<void> {
    const clientData = orderplacingdata.get(clientId);
    if (!clientData) {
      console.warn('No data found for clientId:', clientId);
      return;
    }

    const { intervalId } = clientData;
    if (intervalId !== null) {
      clearInterval(intervalId);
      clientData.intervalId = null;
      orderplacingdata.set(clientId, clientData);
      console.log(`Cleared interval for clientId ${clientId}`);
    }
  }

  async function mainx(clientId: string): Promise<void> {
    const clientData = orderplacingdata.get(clientId);
    if (!clientData) {
      const error = new Error('No data found for clientId');
      console.error(error.message, { clientId });
      throw error;
    }

    const { newclient, symbol, side, stopLossPrice, takeProfitPrice, quantity } = clientData;
    console.log('Placing stop loss and target for clientId:', clientId);

    try {
      const newStopOrder: NewFuturesOrderParams<any> = {
        positionSide: 'BOTH',
        priceProtect: 'TRUE',
        symbol,
        side: side === 'BUY' ? 'SELL' : 'BUY',
        type: 'STOP_MARKET',
        stopPrice: stopLossPrice,
        timeInForce: 'GTE_GTC',
        workingType: 'MARK_PRICE',
        quantity: parseFloat(quantity),
        reduceOnly: 'false',
      };

      await newclient.submitNewOrder(newStopOrder);
      console.log('Stop-loss placed successfully for clientId:', clientId);

      const newTargetOrder: NewFuturesOrderParams<any> = {
        positionSide: 'BOTH',
        priceProtect: 'TRUE',
        symbol,
        side: side === 'BUY' ? 'SELL' : 'BUY',
        type: 'TAKE_PROFIT_MARKET',
        stopPrice: takeProfitPrice,
        timeInForce: 'GTE_GTC',
        workingType: 'MARK_PRICE',
        quantity: parseFloat(quantity),
        reduceOnly: 'false',
      };

      await newclient.submitNewOrder(newTargetOrder);
      console.log('Take-profit placed successfully for clientId:', clientId);

      await Order.deleteOne({ clientId }).exec();
      orderplacingdata.delete(clientId);
    } catch (error) {
      console.error('Error placing stop-loss/take-profit for clientId:', clientId, error);
      throw new Error(`Failed to place stop-loss/take-profit for clientId ${clientId}: ${error.message}`);
    }
  }

  async function checkProcessOrders(newclient: USDMClient): Promise<void> {
    try {
      console.log('Checking open positions and orders');
      const positionsData = await newclient.getPositionsV3();
      const positions = Array.isArray(positionsData)
        ? positionsData.filter((position) => parseFloat(String(position.positionAmt)) !== 0)
        : [];
      const openOrdersData = await newclient.getAllOpenOrders();
      const openOrders = Array.isArray(openOrdersData)
        ? openOrdersData.filter((order) => parseFloat(String(order.orderId)) !== 0)
        : [];

      for (const position of positions) {
        const symbol = position.symbol;
        const positionQuantity = Math.abs(parseFloat(String(position.positionAmt)));
        const side = parseFloat(String(position.positionAmt)) > 0 ? 'SELL' : 'BUY';
        console.log(`Processing symbol: ${symbol}, Position Quantity: ${positionQuantity}`);

        const matchingStopMarketOrders = openOrders.filter(
          (order) => order.symbol === symbol && order.timeInForce === 'GTE_GTC' && order.type === 'STOP_MARKET',
        );
        const matchingTakeProfitOrders = openOrders.filter(
          (order) => order.symbol === symbol && order.timeInForce === 'GTE_GTC' && order.type === 'TAKE_PROFIT_MARKET',
        );

        const totalStopMarketQuantity = matchingStopMarketOrders.reduce(
          (total, order) => total + parseFloat(String(order.origQty)),
          0,
        );
        const totalTakeProfitQuantity = matchingTakeProfitOrders.reduce(
          (total, order) => total + parseFloat(String(order.origQty)),
          0,
        );

        if (matchingStopMarketOrders.length === 0 || matchingTakeProfitOrders.length === 0) {
          console.log(`Symbol: ${symbol}, Position Quantity: ${positionQuantity}`);
          console.log('No stop-market or take-profit orders found; closing position');

          const positionsCheck = (await newclient.getPositionsV3()).find((pos) => pos.symbol === symbol);
          if (positionsCheck && parseFloat(String(positionsCheck.positionAmt)) !== 0) {
            const newOrder: NewFuturesOrderParams<number> = {
              symbol,
              side,
              type: 'MARKET',
              quantity: positionQuantity,
            };

            await newclient.submitNewOrder(newOrder);
            console.log(`Closed position for ${symbol}`);
          }
        } else if (positionQuantity > totalStopMarketQuantity || positionQuantity > totalTakeProfitQuantity) {
          console.log(
            `Position Quantity (${positionQuantity}) exceeds Stop Market (${totalStopMarketQuantity}) or Take Profit (${totalTakeProfitQuantity})`,
          );
          const extraQuantity = positionQuantity - Math.min(totalStopMarketQuantity, totalTakeProfitQuantity);

          const positionsCheck = (await newclient.getPositionsV3()).find((pos) => pos.symbol === symbol);
          if (positionsCheck && parseFloat(String(positionsCheck.positionAmt)) !== 0) {
            const newOrder: NewFuturesOrderParams<number> = {
              symbol,
              side,
              type: 'MARKET',
              quantity: extraQuantity,
            };

            await newclient.submitNewOrder(newOrder);
            console.log(`Closed extra position for ${symbol}`);
          }
        }
      }
    } catch (error) {
      console.error('Error in checkProcessOrders:', error);
      throw new Error(`Failed to check positions: ${error.message}`);
    }
  }

  return { getAnd, startCheckingOrders, clearCheckingOrders, loadOrdersFromDatabase };
}
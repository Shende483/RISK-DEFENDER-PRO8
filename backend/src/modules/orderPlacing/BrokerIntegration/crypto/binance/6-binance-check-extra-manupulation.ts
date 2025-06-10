// src/extra-pending-delete/extra-pending-delete.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { USDMClient, WebsocketClient, NewFuturesOrderParams } from 'binance';
import { SocksProxyAgent } from 'socks-proxy-agent';

// Import schema
import { CheckExtraType, CheckExtraDocument } from './9-binance-check-extra-manupulation.schema';

// src/extra-pending-delete/interfaces.ts
export interface BinancePosition {
  symbol: string;
  positionAmt: string;
  [key: string]: any;
}

export interface BinanceOrder {
  symbol: string;
  orderId: string;
  origQty: string;
  type: string;
  timeInForce: string;
  time: number;
  [key: string]: any;
}

export interface UserDataEvent {
  eventType: string;
  order?: {
    orderStatus: string;
    orderType: string;
    timeInForce: string;
    realisedProfit?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface OrderData {
  clientId: string;
  api_key: string;
  api_secret: string;
  ipAddress: string;
  socksPort: string;
  httpPort: number;
  ipUsername: string;
  ipPassword: string;
  newclient: USDMClient;
  wsClient: WebsocketClient;
  statusChanged: boolean;
  wsClientListenersAdded: boolean;
}

// Constants
const wsBaseUrl = 'wss://fstream.binance.com';
const market = 'usdm';
const updateSpeedMs = 5000;

// Map to store user orders
const userOrders = new Map<string, OrderData>();

@Injectable()
export class ExtraPendingDeleteService {
  constructor(
    @InjectModel(CheckExtraType.name) private checkExtraModel: Model<CheckExtraDocument>
  ) {
    this.loadOrdersFromDatabase();
  }

  // Load orders from the database
  private async loadOrdersFromDatabase(): Promise<void> {
    try {
      const orders: CheckExtraType[] = await this.checkExtraModel.find({}).exec();
      for (const order of orders) {
        const { api_key, api_secret, ipAddress, socksPort, httpPort, ipUsername, ipPassword } = order;
        const clientId = `${api_key}_${api_secret}`;

        let newclient: USDMClient;
        let wsClient: WebsocketClient;

        if (!userOrders.has(clientId)) {
          newclient = new USDMClient({
            api_key,
            api_secret,
            recvWindow: 4000,
          });

          const proxyUrl = `socks5://${ipUsername}:${ipPassword}@${ipAddress}:${socksPort}`;
          wsClient = new WebsocketClient({
            api_key,
            api_secret,
            beautify: true,
            wsOptions: {
              // agent: new SocksProxyAgent(proxyUrl),
            },
          });

          // Initialize all OrderData properties
          userOrders.set(clientId, {
            clientId,
            api_key,
            api_secret,
            ipAddress,
            socksPort,
            httpPort,
            ipUsername,
            ipPassword,
            newclient,
            wsClient,
            statusChanged: false,
            wsClientListenersAdded: false,
          });
        } else {
          const existingOrder = userOrders.get(clientId);
          if (existingOrder) {
            newclient = existingOrder.newclient;
            wsClient = existingOrder.wsClient;
          } else {
            continue; // Skip if order data is unexpectedly undefined
          }
        }

        this.startCheckingOrders(clientId);
      }
    } catch (error) {
      console.error('Error loading orders from database:', error);
    }
  }

  // Handle incoming order data
  public async ExtraInfoDataGet(
    api_key: string,
    api_secret: string,
    ipAddress: string,
    socksPort: string,
    httpPort: number,
    ipUsername: string,
    ipPassword: string
  ): Promise<void> {
    // Removed socket from validation since it's not in the function signature
    if (!api_key || !api_secret || !ipAddress || !socksPort || !httpPort || !ipUsername || !ipPassword) {
      console.error('Missing required parameters:', { api_key, api_secret, ipAddress, socksPort, httpPort, ipUsername, ipPassword });
      return;
    }

    const clientId = `${api_key}_${api_secret}`;
    let newclient: USDMClient;
    let wsClient: WebsocketClient;

    if (!userOrders.has(clientId)) {
      newclient = new USDMClient({
        api_key,
        api_secret,
        recvWindow: 3000,
      });

      const proxyUrl = `socks5://${ipUsername}:${ipPassword}@${ipAddress}:${socksPort}`;
      wsClient = new WebsocketClient({
        api_key,
        api_secret,
        beautify: true,
        wsOptions: {
          // agent: new SocksProxyAgent(proxyUrl),
        },
      });
    } else {
      const existingOrder = userOrders.get(clientId);
      if (!existingOrder) {
        console.error('Order data not found for clientId:', clientId);
        return;
      }
      newclient = existingOrder.newclient;
      wsClient = existingOrder.wsClient;
    }

    const orderData: OrderData = {
      clientId,
      api_key,
      api_secret,
      ipAddress,
      socksPort,
      httpPort,
      ipUsername,
      ipPassword,
      newclient,
      wsClient,
      statusChanged: false,
      wsClientListenersAdded: false,
    };

    userOrders.set(clientId, orderData);

    try {
      await this.checkExtraModel
        .findOneAndUpdate({ clientId }, { $set: orderData }, { upsert: true, new: true })
        .exec();
      console.log('Stored data for clientId:', clientId);
    } catch (error) {
      console.error('Error saving order data to database:', error);
    }

    this.startCheckingOrders(clientId);
  }

  // Start checking orders for a client
  private startCheckingOrders(clientId: string): void {
    const orderData = userOrders.get(clientId);
    if (!orderData) {
      console.error('Order data not found for clientId:', clientId);
      return;
    }

    const { newclient, wsClient, statusChanged, wsClientListenersAdded } = orderData;

    if (!statusChanged) {
      orderData.statusChanged = true;
      userOrders.set(clientId, orderData);

      if (!wsClientListenersAdded) {
        // Uncommented and added type for WebSocket message handler
        wsClient.on('formattedMessage', (rawMessage: any) => {
          try {
            const beautifiedMessage: UserDataEvent | UserDataEvent[] = rawMessage;
            if (!Array.isArray(beautifiedMessage)) {
              this.onUserDataEvent(beautifiedMessage, clientId);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        });

        wsClient.on('open', () => {
          this.processOpenOrders(newclient, clientId);
          console.log(`Connection opened for ${clientId}`);
        });

        wsClient.on('reply', (data: any) => {
          console.log(`Reply for ${clientId}:`, JSON.stringify(data, null, 2));
        });

        wsClient.on('reconnecting', () => {
          console.log(`WebSocket automatically reconnecting for ${clientId}...`);
        });

        wsClient.on('reconnected', () => {
          console.log(`WebSocket has reconnected for ${clientId}`);
        });

        /*
        wsClient.on('error', (err: Error) => {
          console.error(`WebSocket Error for ${clientId}:`, err);
        });
*/
        wsClient.subscribeUsdFuturesUserDataStream();
        orderData.wsClientListenersAdded = true;
        userOrders.set(clientId, orderData);
      }
    }
  }

  // Handle WebSocket user data events
  private async onUserDataEvent(data: UserDataEvent, clientId: string): Promise<void> {
    const orderData = userOrders.get(clientId);
    if (!orderData) {
      console.error('Order data not found for clientId:', clientId);
      return;
    }
    const { newclient } = orderData;

    switch (data.eventType) {
      case 'ACCOUNT_UPDATE':
        console.log(`Balance Update for ${clientId}:`, data);
        break;
      case 'ORDER_TRADE_UPDATE':
        console.log(`Order Trade Update for ${clientId}:`, data);
        if (data.order?.orderStatus === 'NEW') {
          console.log(`Checking extra pending order for new ${clientId}`);
        }

        
        if (data.order?.orderStatus === 'FILLED') {
         console.log(`Checking extra pending order FILLED ORDER ${clientId}`);
         setTimeout(() => {
          this.processOpenOrders(newclient,clientId);
          }, 4000);
          }
        try {
          if (newclient) {
            if (data.order && data.order.orderStatus === 'EXPIRED' && (data.order.orderType === 'TAKE_PROFIT_MARKET' || data.order.orderType === 'STOP_MARKET') && data.order.timeInForce === 'GTE_GTC') {
              console.log('We received cancelled or expired: for extra order', data.order.order);
             setTimeout(() => {
              this.processOpenOrders(newclient,clientId);
              }, 5000);
            }
          // if (data.order.orderStatus === 'FILLED' && data.order.realisedProfit === 0 )  {
       
           // }
          }
        } catch (error) {
         // console.error('Error fetching positions or open orders', error.message);
        }
        break;
    }
  }

  /*
  // Delete client data
  private async deleteClientData(clientId: string): Promise<void> {
    userOrders.delete(clientId);
    try {
     // await this.checkExtraModel.findOneAndDelete({ clientId }).exec();
      console.log(`Deleted data for clientId: ${clientId}`);
    } catch (error) {
      console.error(`Error deleting data for clientId: ${clientId}`, error);
    }
  }
*/
  // Process open orders
  private async processOpenOrders(newclient: USDMClient, clientId: string): Promise<void> {
    try {
      const positionsData = await newclient.getPositionsV3();
      const positions: BinancePosition[] = Array.isArray(positionsData)
        ? positionsData
            .map((position) => ({
              ...position,
              positionAmt: String(position.positionAmt), // Explicitly convert positionAmt to string
            }))
            .filter((position) => !/^0+(.0+)?$/.test(position.positionAmt))
        : [];

      const openOrdersData = await newclient.getAllOpenOrders();
      const openOrders: BinanceOrder[] = Array.isArray(openOrdersData)
        ? openOrdersData
            .map((order) => ({
              ...order,
              orderId: String(order.orderId), // Convert orderId to string
              origQty: String(order.origQty), // Ensure origQty is a string
            }))
            .filter((order) => !/^0+(.0+)?$/.test(order.orderId))
        : [];

        /*
      if (positions.length === 0 && openOrders.length === 0) {
        await this.deleteClientData(clientId);
        console.log('No open positions and open orders, deleted client data');
        return;
      }
*/
      for (const position of positions) {
        const symbol = position.symbol;
        const relevantOpenOrders = openOrders.filter((order) => order.symbol === symbol && order.timeInForce === 'GTE_GTC');

        if (relevantOpenOrders.length) {
          const quantitiesMap: { [key: string]: BinanceOrder[] } = {};
          const pairedOrders: BinanceOrder[] = [];
          const unpairedOrders: BinanceOrder[] = [];

          relevantOpenOrders.forEach((order) => {
            const qty = order.origQty;
            if (quantitiesMap[qty]) {
              let paired = false;
              let smallestDifference = Infinity;
              let bestPairIndex = -1;

              for (let i = 0; i < quantitiesMap[qty].length; i++) {
                const existingOrder = quantitiesMap[qty][i];
                const timeDifference = Math.abs(order.time - existingOrder.time);

                if (
                  order.type !== existingOrder.type &&
                  ((order.type === 'STOP_MARKET' && existingOrder.type === 'TAKE_PROFIT_MARKET') ||
                    (order.type === 'TAKE_PROFIT_MARKET' && existingOrder.type === 'STOP_MARKET'))
                ) {
                  if (timeDifference < smallestDifference) {
                    smallestDifference = timeDifference;
                    bestPairIndex = i;
                    paired = true;
                  }
                }
              }

              if (paired) {
                pairedOrders.push(order, quantitiesMap[qty][bestPairIndex]);
                quantitiesMap[qty].splice(bestPairIndex, 1);
              } else {
                quantitiesMap[qty].push(order);
              }
            } else {
              quantitiesMap[qty] = [order];
            }
          });

          Object.values(quantitiesMap)
            .flat()
            .forEach((order) => unpairedOrders.push(order));

          for (const order of unpairedOrders) {
            try {
              await newclient.cancelOrder({
                symbol: order.symbol,
                orderId: Number(order.orderId),
              });
              console.log(`Cancelled unpaired order: ${JSON.stringify(order)}`);
              setTimeout(() => {
                this.checkProcessOrders(newclient, clientId);
              }, 3000);
            } catch (error) {
              console.error(`Failed to cancel order ${order.orderId}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in processOpenOrders:', error);
    }
  }

  // Check and process orders
  private async checkProcessOrders(newclient: USDMClient, clientId: string): Promise<void> {
    try {
      console.log('Starting the process with a delay of 7 seconds.');
      const positionsData = await newclient.getPositionsV3();
      const positions: BinancePosition[] = Array.isArray(positionsData)
        ? positionsData
            .map((position) => ({
              ...position,
              positionAmt: String(position.positionAmt), // Explicitly convert positionAmt to string
            }))
            .filter((position) => !/^0+(.0+)?$/.test(position.positionAmt))
        : [];
      const openOrdersData = await newclient.getAllOpenOrders();
      const openOrders: BinanceOrder[] = Array.isArray(openOrdersData)
        ? openOrdersData
            .map((order) => ({
              ...order,
              orderId: String(order.orderId), // Convert orderId to string
              origQty: String(order.origQty), // Ensure origQty is a string
            }))
            .filter((order) => !/^0+(.0+)?$/.test(order.orderId))
        : [];

      for (const position of positions) {
        try {
          const symbol = position.symbol;
          const getside = parseFloat(position.positionAmt);
          const positionQuantity = Math.abs(parseFloat(position.positionAmt));
          console.log(`Processing symbol: ${symbol}, Position Quantity: ${positionQuantity}${getside}`);

          const matchingStopMarketOrders = openOrders.filter(
            (order) => order.symbol === symbol && order.timeInForce === 'GTE_GTC' && order.type === 'STOP_MARKET'
          );
          const matchingTakeProfitOrders = openOrders.filter(
            (order) => order.symbol === symbol && order.timeInForce === 'GTE_GTC' && order.type === 'TAKE_PROFIT_MARKET'
          );

          const totalStopMarketQuantity = matchingStopMarketOrders.reduce(
            (total, order) => total + Math.abs(parseFloat(order.origQty)),
            0
          );
          const totalTakeProfitQuantity = matchingTakeProfitOrders.reduce(
            (total, order) => total + Math.abs(parseFloat(order.origQty)),
            0
          );

          if (matchingStopMarketOrders.length === 0 || matchingTakeProfitOrders.length === 0) {
            const side = getside > 0 ? 'SELL' : 'BUY';
            console.log('here we recieved , no stop or target present ');

            const positionsDataCheck = await newclient.getPositionsV3();
            const positionsCheck: BinancePosition[] = Array.isArray(positionsDataCheck)
              ? positionsDataCheck
                  .map((position) => ({
                    ...position,
                    positionAmt: String(position.positionAmt), // Explicitly convert positionAmt to string
                  }))
                  .filter((position) => !/^0+(.0+)?$/.test(position.positionAmt))
              : [];
            const currentPosition = positionsCheck.find((pos) => pos.symbol === symbol);
            console.log('gfhdhdhhdd', currentPosition);

            if (currentPosition) {
              let newOrder: NewFuturesOrderParams<any> | null = {
                symbol,
                side,
                type: 'MARKET',
                quantity: positionQuantity,
              };

              if (newOrder) {
                try {
                  await newclient.submitNewOrder(newOrder);
                  console.log(`New order submitted succ fo by websocket to close position: ${JSON.stringify(newOrder)}`);
                  newOrder = null; // This is now valid because newOrder can be null
                  await this.processOpenOrders(newclient, clientId);
                } catch (error) {
                  console.error('Error submitting new order:', error);
                }
              }
            } else {
              console.log('no for symbol, that why dont close position');
            }
          } else {
            if (totalStopMarketQuantity !== totalTakeProfitQuantity) {
              console.log(`OPEN ORDER Quantity NOT MATCH (${positionQuantity})`);
              await this.processOpenOrders(newclient, clientId);
            }

            if (positionQuantity < totalStopMarketQuantity && positionQuantity < totalTakeProfitQuantity) {
              console.log(
                `Position Quantity (${positionQuantity}) is less than both Stop Market (${totalStopMarketQuantity}) and Take Profit (${totalTakeProfitQuantity}) orders.`
              );
              await this.processOpenOrders(newclient, clientId);
            }

            if (positionQuantity > totalStopMarketQuantity || positionQuantity > totalTakeProfitQuantity) {
              const extraQuantity = positionQuantity - (totalStopMarketQuantity || totalTakeProfitQuantity);
              const side = getside > 0 ? 'SELL' : 'BUY';

              const positionsDataCheck = await newclient.getPositions();
              const positionsCheck: BinancePosition[] = Array.isArray(positionsDataCheck)
                ? positionsDataCheck
                    .map((position) => ({
                      ...position,
                      positionAmt: String(position.positionAmt), // Explicitly convert positionAmt to string
                    }))
                    .filter((position) => !/^0+(.0+)?$/.test(position.positionAmt))
                : [];
              const currentPosition = positionsCheck.find((pos) => pos.symbol === symbol);

              if (currentPosition) {
                let newOrder: NewFuturesOrderParams<any> | null = {
                  symbol,
                  side,
                  type: 'MARKET',
                  quantity: extraQuantity,
                };

                if (newOrder !== null) {
                  try {
                    // Fixed incorrect spread syntax
                    await newclient.submitNewOrder(newOrder);
                    console.log(`New order submitted successfully to close position: ${JSON.stringify(newOrder)}`);
                    newOrder = null;
                    await this.processOpenOrders(newclient, clientId);
                  } catch (error) {
                    console.error('Error submitting new order:', error);
                  }
                }
              } else {
                console.log('no open position for symbol, that why dont close position');
              }
            }
          }
        } catch (error) {
          console.error(`Error processing position for symbol ${position.symbol}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in checkAndProcessOrders:', error);
    }
  }
}
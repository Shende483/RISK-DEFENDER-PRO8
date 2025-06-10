import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Response } from 'express';
import { MarketType } from '../../adminModules/MarketType/marketType.schema';
import { Broker, BrokerDocument } from '../../adminModules/BrokerManagment/broker.schema';

import { OrderSubmitDto } from './dto/orderSubmit.dto';
import { OrderSubmitType, OrderSubmitDocument } from './orderSubmit.schema';
import { BrokerFactory } from '../BrokerIntegration/broker.factory';
import * as moment from 'moment';
import { BrokerAccount } from 'src/modules/sidebar-management/trading-dashboard-management/trading-dashboard.schema';

@Injectable()
export class OrderSubmitService {
  constructor(
    @InjectModel(MarketType.name) private marketTypeModel: Model<MarketType>,
    @InjectModel(Broker.name) private BrokerModel: Model<Broker>,
    @InjectModel(BrokerAccount.name) private BrokerAccountModel: Model<BrokerAccount>,
    @InjectModel(OrderSubmitType.name) private orderPlacementModel: Model<OrderSubmitDocument>,
    private readonly brokerFactory: BrokerFactory,
  ) {}



  // Common validation for market type, broker, and broker account
  private async validateCommon(
    marketTypeId: string,
    brokerId: string,
    brokerAccountName: string,
    userId: string,
    orderType:string,
    res: Response,
  ): Promise<{
    marketTypeName: string;
    brokerName: string;
    tradingRules: Record<string, any>;
    apiKey: string;
    secretKey: string;
  } | null> {
    // Validate Market Type
    const marketType = await this.marketTypeModel.findById(marketTypeId);
    if (!marketType) {
      const errorMessage = 'Market type does not exist.';
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return null;
    }
    const marketTypeName = marketType.name;
    console.log('Market Type:', marketTypeName);

    // Validate Broker
    const broker = await this.BrokerModel.findById(brokerId);
    if (!broker) {
      const errorMessage = 'Broker does not exist.';
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return null;
    }
    const brokerName = broker.name;
    console.log('Broker Name:', brokerName);

    // Validate Broker Account
    const brokerAccount = await this.BrokerAccountModel.findOne({
      marketTypeId,
      userId,
      brokerId,
      brokerAccountName,
    });
    if (!brokerAccount) {
      const errorMessage = 'Broker account does not exist or does not match the provided details.';
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return null;
    }

    // Get Trading Rules
    const tradingData = brokerAccount?.tradingRuleData?.[orderType] || [];
    console.log('Trading Data:', tradingData);
    const tradingRules = tradingData.reduce((acc, rule) => {
      acc[rule.key] = rule.value;
      return acc;
    }, {} as Record<string, any>);

    return {
      marketTypeName,
      brokerName,
      tradingRules,
      apiKey: brokerAccount.apiKey,
      secretKey: brokerAccount.secretKey,
    };
  }








// get Balance
  async getBalance(
    createOrderDto: OrderSubmitDto,
    res: Response,
    userId: string,
   operation: string,

  ): Promise<void> {
    const { marketTypeId, brokerId, brokerAccountName,orderType } = createOrderDto;

    // Step 1: Validate Common Requirements
    const commonValidation = await this.validateCommon(
      marketTypeId,
      brokerId,
      brokerAccountName,
      userId,
      orderType,
      res,
    );
    if (!commonValidation) return;

    const { marketTypeName, brokerName, apiKey, secretKey } = commonValidation;
console.log('Common Validation:', commonValidation);
    // Step 2: Route to Broker via BrokerFactory
    let brokerInstance;
    try {
      brokerInstance = this.brokerFactory.getBroker(marketTypeName,brokerName,orderType,operation);
      console.log('Broker Instance:', brokerInstance);
    } catch (error) {
      const errorMessage = `Invalid market type or broker: ${error.message}`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Step 3: Pass Data to Broker Service
    try {
      const balanceData = await brokerInstance(userId, apiKey, secretKey);
      console.log('Balance Data:', balanceData);
      res.status(200).json({
        statusCode: 200,
        message: '✅ Balance retrieved successfully.',
        consoleMessage: '✅ Balance retrieved successfully.',
        success: true,
        data: balanceData,
      });
    } catch (error) {
      const errorMessage = `Failed to retrieve balance from broker: ${error.message}`;
      console.log(errorMessage);
      res.status(500).json({
        statusCode: 500,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
    }
  }




//GET SYMBOL LIST 
  async getSymbolList(
    createOrderDto: OrderSubmitDto,
    res: Response,
    userId: string,
  ): Promise<void> {
    const { marketTypeId, brokerId, brokerAccountName } = createOrderDto;

    // Step 1: Validate Common Requirements
    const commonValidation = await this.validateCommon(
      marketTypeId,
      brokerId,
      brokerAccountName,
      userId,
      'getSymbolList',
      res,
    );
    if (!commonValidation) return;

    const { marketTypeName, brokerName, apiKey, secretKey } = commonValidation;

    // Step 2: Route to Broker via BrokerFactory
    let brokerInstance;
    try {
      brokerInstance = this.brokerFactory.getBroker(marketTypeName, brokerName);
      console.log('Broker Instance:', brokerInstance);
    } catch (error) {
      const errorMessage = `Invalid market type or broker: ${error.message}`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Step 3: Pass Data to Broker Service
    try {
      const symbolList = await brokerInstance.getSymbolList(userId, apiKey, secretKey);
      console.log('Symbol List:', symbolList);
      res.status(200).json({
        statusCode: 200,
        message: '✅ Symbol list retrieved successfully.',
        consoleMessage: '✅ Symbol list retrieved successfully.',
        success: true,
        data: symbolList,
      });
    } catch (error) {
      const errorMessage = `Failed to retrieve symbol list from broker: ${error.message}`;
      console.log(errorMessage);
      res.status(500).json({
        statusCode: 500,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
    }
  }


  // Set Valid Stop Loss
  async setValidStopLoss(
    createOrderDto: OrderSubmitDto,
    res: Response,
    userId: string,
  ): Promise<void> {
    const { marketTypeId, brokerId, brokerAccountName } = createOrderDto;
    // Step 1: Validate Common Requirements
    const commonValidation = await this.validateCommon(
      marketTypeId,
      brokerId,
      brokerAccountName,
      userId,
      'setValidStopLoss',
      res,
    );
    if (!commonValidation) return;

    const { marketTypeName, brokerName, apiKey, secretKey } = commonValidation;

    // Step 2: Route to Broker via BrokerFactory
    let brokerInstance;
    try {
      brokerInstance = this.brokerFactory.getBroker(marketTypeName, brokerName);
      console.log('Broker Instance:', brokerInstance);
    } catch (error) {
      const errorMessage = `Invalid market type or broker: ${error.message}`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Step 3: Pass Data to Broker Service
    try {
      const stopLossData = await brokerInstance.setValidStopLoss(userId, apiKey, secretKey);
      console.log('Stop Loss Data:', stopLossData);
      res.status(200).json({
        statusCode: 200,
        message: '✅ Valid stop loss set successfully.',
        consoleMessage: '✅ Valid stop loss set successfully.',
        success: true,
        data: stopLossData,
      });
    } catch (error) {
      const errorMessage = `Failed to set valid stop loss with broker: ${error.message}`;
      console.log(errorMessage);
      res.status(500).json({
        statusCode: 500,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
    }
  }





  // Set Valid Target
  async setValidTarget(
    createOrderDto: OrderSubmitDto,
    res: Response,
    userId: string,
  ): Promise<void> {
    const { marketTypeId, brokerId, brokerAccountName } = createOrderDto;
    // Step 1: Validate Common Requirements
    const commonValidation = await this.validateCommon(
      marketTypeId,
      brokerId,
      brokerAccountName,
      userId,
      'setValidTarget',
      res,
    );
    if (!commonValidation) return;

    const { marketTypeName, brokerName, apiKey, secretKey } = commonValidation;

    // Step 2: Route to Broker via BrokerFactory
    let brokerInstance;
    try {
      brokerInstance = this.brokerFactory.getBroker(marketTypeName, brokerName);
      console.log('Broker Instance:', brokerInstance);
    } catch (error) {
      const errorMessage = `Invalid market type or broker: ${error.message}`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Step 3: Pass Data to Broker Service
    try {
      const targetData = await brokerInstance.setValidTarget(userId, apiKey, secretKey);
      console.log('Target Data:', targetData);
      res.status(200).json({
        statusCode: 200,
        message: '✅ Valid target set successfully.',
        consoleMessage: '✅ Valid target set successfully.',
        success: true,
        data: targetData,
      });
    } catch (error) {
      const errorMessage = `Failed to set valid target with broker: ${error.message}`;
      console.log(errorMessage);
      res.status(500).json({
        statusCode: 500,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
    }
  }


  

  // Place New Order
  async placeNewOrder(
    createOrderDto: OrderSubmitDto,
    res: Response,
    userId: string,
    operation: string,
    
  ): Promise<void> {
    const {
      marketTypeId,
      brokerId,
      brokerAccountName,
      orderType,
      symbol,
      allowedDirection,
      marginTypes,
      maxLeverage,
      maxRiskPercentage,
      orderPlacingType,
      entryPrice,
      stopLoss,
      targetPrice,
    } = createOrderDto;

    // Step 1: Validate Common Requirements
    const commonValidation = await this.validateCommon(
      marketTypeId,
      brokerId,
      brokerAccountName,
      userId,
      orderType,
      res,
    );
    if (!commonValidation) return;

    const { marketTypeName, brokerName, tradingRules, apiKey, secretKey } = commonValidation;

    // Step 2: Validate New Order Rules
    const currentTime = moment().utc().format('HH:mm:ss');
    const currentDate = moment().utc();

    // Validate side
    if (!['BUY', 'SELL'].includes(allowedDirection)) {
      const errorMessage = `Invalid order side: ${allowedDirection}. Must be 'BUY' or 'SELL'.`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Rule 1: Validate consecutiveEntryDuration
    if (tradingRules.consecutiveEntryDuration) {
      const duration = moment.duration(tradingRules.consecutiveEntryDuration).asSeconds();
      if (!duration) {
        const errorMessage = 'Invalid consecutiveEntryDuration format in trading rules.';
        console.log(errorMessage);
        res.status(400).json({
          statusCode: 400,
          message: errorMessage,
          consoleMessage: errorMessage,
          success: false,
        });
        return;
      }
      const lastOrder = await this.orderPlacementModel.findOne({ userId, symbol, orderType });
      if (lastOrder) {
        const lastOrderTime = moment(lastOrder.baseModelName).utc();
        const secondsSinceLastOrder = currentDate.diff(lastOrderTime, 'seconds');
        if (secondsSinceLastOrder < duration) {
          const errorMessage = `Consecutive entry blocked; must wait ${duration - secondsSinceLastOrder} seconds since last order.`;
          console.log(errorMessage);
          res.status(400).json({
            statusCode: 400,
            message: errorMessage,
            consoleMessage: errorMessage,
            success: false,
          });
          return;
        }
      }
    }

    // Rule 2: Validate entryBlockPeriod
    if (tradingRules.entryBlockPeriod) {
      const [startTime, endTime] = tradingRules.entryBlockPeriod.split(',').map((t: string) => t.trim());
      if (!moment(startTime, 'HH:mm:ss', true).isValid() || !moment(endTime, 'HH:mm:ss', true).isValid()) {
        const errorMessage = 'Invalid entryBlockPeriod format in trading rules.';
        console.log(errorMessage);
        res.status(400).json({
          statusCode: 400,
          message: errorMessage,
          consoleMessage: errorMessage,
          success: false,
        });
        return;
      }
      if (startTime <= endTime) {
        if (currentTime >= startTime && currentTime <= endTime) {
          const errorMessage = `Order submission blocked during ${startTime} - ${endTime} UTC.`;
          console.log(errorMessage);
          res.status(400).json({
            statusCode: 400,
            message: errorMessage,
            consoleMessage: errorMessage,
            success: false,
          });
          return;
        }
      } else {
        if (currentTime >= startTime || currentTime <= endTime) {
          const errorMessage = `Order submission blocked during ${startTime} - ${endTime} UTC (midnight crossover).`;
          console.log(errorMessage);
          res.status(400).json({
            statusCode: 400,
            message: errorMessage,
            consoleMessage: errorMessage,
            success: false,
          });
          return;
        }
      }
    }

    // Rule 3: Validate maxEntriesInSpecificSymbol
    if (tradingRules.maxEntriesInSpecificSymbol) {
      const activeOrders = await this.orderPlacementModel.countDocuments({
        userId,
        symbol,
        orderType,
        status: { $in: ['open', 'pending'] },
      });
      if (activeOrders >= tradingRules.maxEntriesInSpecificSymbol) {
        const errorMessage = `Maximum entries (${tradingRules.maxEntriesInSpecificSymbol}) for symbol ${symbol} exceeded.`;
        console.log(errorMessage);
        res.status(400).json({
          statusCode: 400,
          message: errorMessage,
          consoleMessage: errorMessage,
          success: false,
        });
        return;
      }
    }

    // Rule 4: Validate maxPendingEntryInSpecificSymbol
    if (tradingRules.maxPendingEntryInSpecificSymbol) {
      const pendingOrders = await this.orderPlacementModel.countDocuments({
        userId,
        symbol,
        orderType,
        status: 'pending',
      });
      if (pendingOrders >= tradingRules.maxPendingEntryInSpecificSymbol) {
        const errorMessage = `Maximum pending entries (${tradingRules.maxPendingEntryInSpecificSymbol}) for symbol ${symbol} exceeded.`;
        console.log(errorMessage);
        res.status(400).json({
          statusCode: 400,
          message: errorMessage,
          consoleMessage: errorMessage,
          success: false,
        });
        return;
      }
    }

    // Rule 5: Validate maxEntryPerDay
    if (tradingRules.maxEntryPerDay) {
      const startOfDay = moment().utc().startOf('day').toDate();
      const endOfDay = moment().utc().endOf('day').toDate();
      const dailyEntries = await this.orderPlacementModel.countDocuments({
        userId,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });
      if (dailyEntries >= tradingRules.maxEntryPerDay) {
        const errorMessage = `Maximum daily entries (${tradingRules.maxEntryPerDay}) exceeded.`;
        console.log(errorMessage);
        res.status(400).json({
          statusCode: 400,
          message: errorMessage,
          consoleMessage: errorMessage,
          success: false,
        });
        return;
      }
    }

    // Rule 6: Validate maxPendingOrder
    if (tradingRules.maxPendingOrder) {
      const pendingOrders = await this.orderPlacementModel.countDocuments({
        userId,
        status: 'pending',
      });
      if (pendingOrders >= tradingRules.maxPendingOrder) {
        const errorMessage = `Maximum pending orders (${tradingRules.maxPendingOrder}) exceeded.`;
        console.log(errorMessage);
        res.status(400).json({
          statusCode: 400,
          message: errorMessage,
          consoleMessage: errorMessage,
          success: false,
        });
        return;
      }
    }

    // Rule 7: Validate maxRiskEntry
    if (tradingRules.maxRiskEntry && maxRiskPercentage > tradingRules.maxRiskEntry) {
      const errorMessage = `Risk percentage (${maxRiskPercentage}) exceeds maximum allowed risk (${tradingRules.maxRiskEntry}).`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Rule 8: Validate entrySide
    if (tradingRules.entrySide && tradingRules.entrySide !== 'Both' && tradingRules.entrySide !== allowedDirection) {
      const errorMessage = `Order direction (${allowedDirection}) does not match allowed entry side (${tradingRules.entrySide}).`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Rule 9: Validate maxLeverage
    if (tradingRules.maxLeverage && maxLeverage > tradingRules.maxLeverage) {
      const errorMessage = `Leverage (${maxLeverage}) exceeds maximum allowed leverage (${tradingRules.maxLeverage}).`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Rule 10: Validate marginTypes
    if (tradingRules.marginTypes && tradingRules.marginTypes !== 'Both' && tradingRules.marginTypes !== marginTypes) {
      const errorMessage = `Margin type (${marginTypes}) does not match allowed margin types (${tradingRules.marginTypes}).`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Rule 11: Validate entryType
    if (tradingRules.entryType && tradingRules.entryType !== 'Both' && tradingRules.entryType !== orderType) {
      const errorMessage = `Order type (${orderType}) does not match allowed entry type (${tradingRules.entryType}).`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Step 3: Route to Broker via BrokerFactory
    let brokerInstance;
    try {
      brokerInstance = this.brokerFactory.getBroker(marketTypeName, brokerName,orderType,operation);
      console.log('Broker Instance:', brokerInstance);
    } catch (error) {
      const errorMessage = `Invalid market type or broker: ${error.message}`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Step 4: Pass Data to Broker Service
    try {
      const brokerOrder = await brokerInstance(userId, apiKey, secretKey,brokerAccountName,{
        symbol,
        side: allowedDirection,
        type: orderType,
        orderPlacingType,
        marginTypes,
        maxLeverage,
        maxRiskPercentage,
        entryPrice,
        stopLoss,
        targetPrice,
      });

      const successMessage = '✅ Order submitted successfully.';
      console.log(successMessage);
      res.status(200).json({
        statusCode: 200,
        message: successMessage,
        consoleMessage: successMessage,
        success: true,
        data: brokerOrder,
      });
    } catch (error) {
      const errorMessage = `Failed to process order with broker: ${error.message}`;
      console.log(errorMessage);
      res.status(500).json({
        statusCode: 500,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
    }
  }

  // Place Pending Order
  async placePendingOrder(
    createOrderDto: OrderSubmitDto,
    res: Response,
    userId: string,
    operation:string,

  ): Promise<void> {
    const {
      marketTypeId,
      brokerId,
      brokerAccountName,
      orderType,
      symbol,
      allowedDirection,
      marginTypes,
      maxLeverage,
      maxRiskPercentage,
      orderPlacingType,
      entryPrice,
      stopLoss,
      targetPrice,
      orderId,
    } = createOrderDto;

    // Step 1: Validate Common Requirements
    const commonValidation = await this.validateCommon(
      marketTypeId,
      brokerId,
      brokerAccountName,
      userId,
      orderType,
      res,
    );
    if (!commonValidation) return;

    const { marketTypeName, brokerName, tradingRules, apiKey, secretKey } = commonValidation;

    // Step 2: Validate Pending Order Rules
    const currentTime = moment().utc().format('HH:mm:ss');
    const currentDate = moment().utc();

    // Validate side
    if (!['BUY', 'SELL'].includes(allowedDirection)) {
      const errorMessage = `Invalid order side: ${allowedDirection}. Must be 'BUY' or 'SELL'.`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Rule 1: Validate consecutiveEntryDuration
    if (tradingRules.consecutiveEntryDuration) {
      const duration = moment.duration(tradingRules.consecutiveEntryDuration).asSeconds();
      if (!duration) {
        const errorMessage = 'Invalid consecutiveEntryDuration format in trading rules.';
        console.log(errorMessage);
        res.status(400).json({
          statusCode: 400,
          message: errorMessage,
          consoleMessage: errorMessage,
          success: false,
        });
        return;
      }
      const lastOrder = await this.orderPlacementModel.findOne({ userId, symbol, orderType });
      if (lastOrder) {
        const lastOrderTime = moment(lastOrder.baseModelName).utc();
        const secondsSinceLastOrder = currentDate.diff(lastOrderTime, 'seconds');
        if (secondsSinceLastOrder < duration) {
          const errorMessage = `Consecutive entry blocked; must wait ${duration - secondsSinceLastOrder} seconds since last order.`;
          console.log(errorMessage);
          res.status(400).json({
            statusCode: 400,
            message: errorMessage,
            consoleMessage: errorMessage,
            success: false,
          });
          return;
        }
      }
    }

    // Rule 2: Validate entryBlockPeriod
    if (tradingRules.entryBlockPeriod) {
      const [startTime, endTime] = tradingRules.entryBlockPeriod.split(',').map((t: string) => t.trim());
      if (!moment(startTime, 'HH:mm:ss', true).isValid() || !moment(endTime, 'HH:mm:ss', true).isValid()) {
        const errorMessage = 'Invalid entryBlockPeriod format in trading rules.';
        console.log(errorMessage);
        res.status(400).json({
          statusCode: 400,
          message: errorMessage,
          consoleMessage: errorMessage,
          success: false,
        });
        return;
      }
      if (startTime <= endTime) {
        if (currentTime >= startTime && currentTime <= endTime) {
          const errorMessage = `Order submission blocked during ${startTime} - ${endTime} UTC.`;
          console.log(errorMessage);
          res.status(400).json({
            statusCode: 400,
            message: errorMessage,
            consoleMessage: errorMessage,
            success: false,
          });
          return;
        }
      } else {
        if (currentTime >= startTime || currentTime <= endTime) {
          const errorMessage = `Order submission blocked during ${startTime} - ${endTime} UTC (midnight crossover).`;
          console.log(errorMessage);
          res.status(400).json({
            statusCode: 400,
            message: errorMessage,
            consoleMessage: errorMessage,
            success: false,
          });
          return;
        }
      }
    }

    // Rule 3: Validate maxPendingEntryInSpecificSymbol
    if (tradingRules.maxPendingEntryInSpecificSymbol) {
      const pendingOrders = await this.orderPlacementModel.countDocuments({
        userId,
        symbol,
        orderType,
        status: 'pending',
      });
      if (pendingOrders >= tradingRules.maxPendingEntryInSpecificSymbol) {
        const errorMessage = `Maximum pending entries (${tradingRules.maxPendingEntryInSpecificSymbol}) for symbol ${symbol} exceeded.`;
        console.log(errorMessage);
        res.status(400).json({
          statusCode: 400,
          message: errorMessage,
          consoleMessage: errorMessage,
          success: false,
        });
        return;
      }
    }

    // Rule 4: Validate maxPendingOrder
    if (tradingRules.maxPendingOrder) {
      const pendingOrders = await this.orderPlacementModel.countDocuments({
        userId,
        status: 'pending',
      });
      if (pendingOrders >= tradingRules.maxPendingOrder) {
        const errorMessage = `Maximum pending orders (${tradingRules.maxPendingOrder}) exceeded.`;
        console.log(errorMessage);
        res.status(400).json({
          statusCode: 400,
          message: errorMessage,
          consoleMessage: errorMessage,
          success: false,
        });
        return;
      }
    }

    // Rule 5: Validate maxRiskEntry
    if (tradingRules.maxRiskEntry && maxRiskPercentage > tradingRules.maxRiskEntry) {
      const errorMessage = `Risk percentage (${maxRiskPercentage}) exceeds maximum allowed risk (${tradingRules.maxRiskEntry}).`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Rule 6: Validate entrySide
    if (tradingRules.entrySide && tradingRules.entrySide !== 'Both' && tradingRules.entrySide !== allowedDirection) {
      const errorMessage = `Order direction (${allowedDirection}) does not match allowed entry side (${tradingRules.entrySide}).`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Rule 7: Validate maxLeverage
    if (tradingRules.maxLeverage && maxLeverage > tradingRules.maxLeverage) {
      const errorMessage = `Leverage (${maxLeverage}) exceeds maximum allowed leverage (${tradingRules.maxLeverage}).`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Rule 8: Validate marginTypes
    if (tradingRules.marginTypes && tradingRules.marginTypes !== 'Both' && tradingRules.marginTypes !== marginTypes) {
      const errorMessage = `Margin type (${marginTypes}) does not match allowed margin types (${tradingRules.marginTypes}).`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Rule 9: Validate entryType
    if (tradingRules.entryType && tradingRules.entryType !== 'Both' && tradingRules.entryType !== orderType) {
      const errorMessage = `Order type (${orderType}) does not match allowed entry type (${tradingRules.entryType}).`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Step 3: Route to Broker via BrokerFactory
    let brokerInstance;
    try {
      brokerInstance = this.brokerFactory.getBroker(marketTypeName, brokerName,orderType,operation);
      console.log('Broker Instance:', brokerInstance);
    } catch (error) {
      const errorMessage = `Invalid market type or broker: ${error.message}`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Step 4: Pass Data to Broker Service
    try {
      const brokerOrder = await brokerInstance(userId, apiKey, secretKey,brokerAccountName,{
        symbol,
        side: allowedDirection,
        type: orderType,
        orderPlacingType,
        marginTypes,
        maxLeverage,
        maxRiskPercentage,
        entryPrice,
        stopLoss,
        targetPrice,
        orderId,
      });

      const successMessage = '✅ Pending order placed successfully.';
      console.log(successMessage);
      res.status(200).json({
        statusCode: 200,
        message: successMessage,
        consoleMessage: successMessage,
        success: true,
        data: brokerOrder,
      });
    } catch (error) {
      const errorMessage = `Failed to place pending order: ${error.message}`;
      console.log(errorMessage);
      res.status(500).json({
        statusCode: 500,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
    }
  }

  // Modify Stop-Loss
  async modifyStopLoss(
    createOrderDto: OrderSubmitDto,
    res: Response,
    userId: string,
  ): Promise<void> {
    const {
      marketTypeId,
      brokerId,
      brokerAccountName,
      orderType,
      symbol,
      allowedDirection,
      marginTypes,
      maxLeverage,
      maxRiskPercentage,
      orderPlacingType,
      entryPrice,
      stopLoss,
      targetPrice,
      orderId,
    } = createOrderDto;

    // Step 1: Validate Common Requirements
    const commonValidation = await this.validateCommon(
      marketTypeId,
      brokerId,
      brokerAccountName,
      userId,
      orderType,
      res,
    );
    if (!commonValidation) return;

    const { marketTypeName, brokerName, tradingRules, apiKey, secretKey } = commonValidation;

    // Step 2: Validate Modify Stop-Loss Rules
    const currentTime = moment().utc().format('HH:mm:ss');

    // Validate orderId
    if (!orderId || isNaN(Number(orderId))) {
      const errorMessage = 'Invalid or missing orderId';
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Rule 1: Validate pendingOrderModifyBlockPeriod
    if (tradingRules.pendingOrderModifyBlockPeriod) {
      const [startTime, endTime] = tradingRules.pendingOrderModifyBlockPeriod
        .split(',')
        .map((t: string) => t.trim());
      if (!moment(startTime, 'HH:mm:ss', true).isValid() || !moment(endTime, 'HH:mm:ss', true).isValid()) {
        const errorMessage = 'Invalid pendingOrderModifyBlockPeriod format in trading rules.';
        console.log(errorMessage);
        res.status(400).json({
          statusCode: 400,
          message: errorMessage,
          consoleMessage: errorMessage,
          success: false,
        });
        return;
      }
      if (startTime <= endTime) {
        if (currentTime >= startTime && currentTime <= endTime) {
          const errorMessage = `Order modification blocked during ${startTime} - ${endTime} UTC.`;
          console.log(errorMessage);
          res.status(400).json({
            statusCode: 400,
            message: errorMessage,
            consoleMessage: errorMessage,
            success: false,
          });
          return;
        }
      } else {
        if (currentTime >= startTime || currentTime <= endTime) {
          const errorMessage = `Order modification blocked during ${startTime} - ${endTime} UTC (midnight crossover).`;
          console.log(errorMessage);
          res.status(400).json({
            statusCode: 400,
            message: errorMessage,
            consoleMessage: errorMessage,
            success: false,
          });
          return;
        }
      }
    }

    // Rule 2: Validate slAndTPTrailingDuration
    if (tradingRules.slAndTPTrailingDuration) {
      const duration = moment.duration(tradingRules.slAndTPTrailingDuration).asSeconds();
      if (!duration) {
        const errorMessage = 'Invalid slAndTPTrailingDuration format in trading rules.';
        console.log(errorMessage);
        res.status(400).json({
          statusCode: 400,
          message: errorMessage,
          consoleMessage: errorMessage,
          success: false,
        });
        return;
      }
      // Add logic if you need to check the timing of stop-loss modifications
    }

    // Rule 3: Validate maxRiskEntry
    if (tradingRules.maxRiskEntry && maxRiskPercentage > tradingRules.maxRiskEntry) {
      const errorMessage = `Risk percentage (${maxRiskPercentage}) exceeds maximum allowed risk (${tradingRules.maxRiskEntry}).`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Step 3: Route to Broker via BrokerFactory
    let brokerInstance;
    try {
      brokerInstance = this.brokerFactory.getBroker(marketTypeName, brokerName);
      console.log('Broker Instance:', brokerInstance);
    } catch (error) {
      const errorMessage = `Invalid market type or broker: ${error.message}`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Step 4: Pass Data to Broker Service
    try {
      const brokerOrder = await brokerInstance.modifyStopLoss(userId, apiKey, secretKey, {
        symbol,
        orderId: Number(orderId),
        stopLoss,
      });

      const successMessage = '✅ Stop loss modified successfully.';
      console.log(successMessage);
      res.status(200).json({
        statusCode: 200,
        message: successMessage,
        consoleMessage: successMessage,
        success: true,
        data: brokerOrder,
      });
    } catch (error) {
      const errorMessage = `Failed to modify stop loss: ${error.message}`;
      console.log(errorMessage);
      res.status(500).json({
        statusCode: 500,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
    }
  }

  // Modify Target
  async modifyTarget(
    createOrderDto: OrderSubmitDto,
    res: Response,
    userId: string,
  ): Promise<void> {
    const {
      marketTypeId,
      brokerId,
      brokerAccountName,
      orderType,
      symbol,
      allowedDirection,
      marginTypes,
      maxLeverage,
      maxRiskPercentage,
      orderPlacingType,
      entryPrice,
      stopLoss,
      targetPrice,
      orderId,
    } = createOrderDto;

    // Step 1: Validate Common Requirements
    const commonValidation = await this.validateCommon(
      marketTypeId,
      brokerId,
      brokerAccountName,
      userId,
      orderType,
      res,
    );
    if (!commonValidation) return;

    const { marketTypeName, brokerName, tradingRules, apiKey, secretKey } = commonValidation;

    // Step 2: Validate Modify Target Rules
    const currentTime = moment().utc().format('HH:mm:ss');

    // Validate orderId
    if (!orderId || isNaN(Number(orderId))) {
      const errorMessage = 'Invalid or missing orderId';
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Rule 1: Validate pendingOrderModifyBlockPeriod
    if (tradingRules.pendingOrderModifyBlockPeriod) {
      const [startTime, endTime] = tradingRules.pendingOrderModifyBlockPeriod
        .split(',')
        .map((t: string) => t.trim());
      if (!moment(startTime, 'HH:mm:ss', true).isValid() || !moment(endTime, 'HH:mm:ss', true).isValid()) {
        const errorMessage = 'Invalid pendingOrderModifyBlockPeriod format in trading rules.';
        console.log(errorMessage);
        res.status(400).json({
          statusCode: 400,
          message: errorMessage,
          consoleMessage: errorMessage,
          success: false,
        });
        return;
      }
      if (startTime <= endTime) {
        if (currentTime >= startTime && currentTime <= endTime) {
          const errorMessage = `Order modification blocked during ${startTime} - ${endTime} UTC.`;
          console.log(errorMessage);
          res.status(400).json({
            statusCode: 400,
            message: errorMessage,
            consoleMessage: errorMessage,
            success: false,
          });
          return;
        }
      } else {
        if (currentTime >= startTime || currentTime <= endTime) {
          const errorMessage = `Order modification blocked during ${startTime} - ${endTime} UTC (midnight crossover).`;
          console.log(errorMessage);
          res.status(400).json({
            statusCode: 400,
            message: errorMessage,
            consoleMessage: errorMessage,
            success: false,
          });
          return;
        }
      }
    }

    // Rule 2: Validate slAndTPTrailingDuration
    if (tradingRules.slAndTPTrailingDuration) {
      const duration = moment.duration(tradingRules.slAndTPTrailingDuration).asSeconds();
      if (!duration) {
        const errorMessage = 'Invalid slAndTPTrailingDuration format in trading rules.';
        console.log(errorMessage);
        res.status(400).json({
          statusCode: 400,
          message: errorMessage,
          consoleMessage: errorMessage,
          success: false,
        });
        return;
      }
      // Add logic if you need to check the timing of take-profit modifications
    }

    // Rule 3: Validate maxRiskEntry
    if (tradingRules.maxRiskEntry && maxRiskPercentage > tradingRules.maxRiskEntry) {
      const errorMessage = `Risk percentage (${maxRiskPercentage}) exceeds maximum allowed risk (${tradingRules.maxRiskEntry}).`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Step 3: Route to Broker via BrokerFactory
    let brokerInstance;
    try {
      brokerInstance = this.brokerFactory.getBroker(marketTypeName, brokerName);
      console.log('Broker Instance:', brokerInstance);
    } catch (error) {
      const errorMessage = `Invalid market type or broker: ${error.message}`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Step 4: Pass Data to Broker Service
    try {
      const brokerOrder = await brokerInstance.modifyTarget(userId, apiKey, secretKey, {
        symbol,
        orderId: Number(orderId),
        targetPrice,
      });

      const successMessage = '✅ Target modified successfully.';
      console.log(successMessage);
      res.status(200).json({
        statusCode: 200,
        message: successMessage,
        consoleMessage: successMessage,
        success: true,
        data: brokerOrder,
      });
    } catch (error) {
      const errorMessage = `Failed to modify target: ${error.message}`;
      console.log(errorMessage);
      res.status(500).json({
        statusCode: 500,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
    }
  }

  // Close Position
  async closePosition(
    createOrderDto: OrderSubmitDto,
    res: Response,
    userId: string,
    operation:string
  ): Promise<void> {
    const {
      marketTypeId,
      brokerId,
      brokerAccountName,
      orderType,
      symbol,
      orderId,
      allowedDirection,
      marginTypes,
      maxLeverage,
      maxRiskPercentage,
      orderPlacingType,
      entryPrice,
      stopLoss,
      targetPrice,
      quantity
      
    } = createOrderDto;

    // Step 1: Validate Common Requirements
    const commonValidation = await this.validateCommon(
      marketTypeId,
      brokerId,
      brokerAccountName,
      userId,
      orderType,
      res,
    );
    if (!commonValidation) return;

    const { marketTypeName, brokerName, tradingRules, apiKey, secretKey } = commonValidation;

    // Step 2: Validate Close Position Rules
    // Validate side
    if (!['BUY', 'SELL'].includes(allowedDirection)) {
      const errorMessage = `Invalid order side: ${allowedDirection}. Must be 'BUY' or 'SELL'.`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Rule 1: Validate positionMinHoldDuration
    if (tradingRules.positionMinHoldDuration) {
      const duration = moment.duration(tradingRules.positionMinHoldDuration, 'minutes').asSeconds();
      if (!duration) {
        const errorMessage = 'Invalid positionMinHoldDuration format in trading rules.';
        console.log(errorMessage);
        res.status(400).json({
          statusCode: 400,
          message: errorMessage,
          consoleMessage: errorMessage,
          success: false,
        });
        return;
      }
      // Add logic to check if the position has been held long enough
      // Example: Query the orderPlacementModel for the position's open time
    }

    // Rule 2: Validate entrySide
    if (tradingRules.entrySide && tradingRules.entrySide !== 'Both' && tradingRules.entrySide !== allowedDirection) {
      const errorMessage = `Order direction (${allowedDirection}) does not match allowed entry side (${tradingRules.entrySide}).`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Rule 3: Validate maxRiskEntry
    if (tradingRules.maxRiskEntry && maxRiskPercentage > tradingRules.maxRiskEntry) {
      const errorMessage = `Risk percentage (${maxRiskPercentage}) exceeds maximum allowed risk (${tradingRules.maxRiskEntry}).`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Step 3: Route to Broker via BrokerFactory
    let brokerInstance;
    try {
      brokerInstance = this.brokerFactory.getBroker(marketTypeName, brokerName,orderType,operation);
      console.log('Broker Instance:', brokerInstance);
    } catch (error) {
      const errorMessage = `Invalid market type or broker: ${error.message}`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Step 4: Pass Data to Broker Service
    try {
      const brokerOrder = await brokerInstance(userId, apiKey, secretKey,brokerAccountName, {
       
        symbol,
        side: allowedDirection,
        orderId,
        quantity
      });

      const successMessage = '✅ Position closed successfully.';
      console.log(successMessage);
      res.status(200).json({
        statusCode: 200,
        message: successMessage,
        consoleMessage: successMessage,
        success: true,
        data: brokerOrder,
      });
    } catch (error) {
      const errorMessage = `Failed to close position: ${error.message}`;
      console.log(errorMessage);
      res.status(500).json({
        statusCode: 500,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
    }
  }

  // Cancel Pending Order
  async cancelPendingOrder(
    createOrderDto: OrderSubmitDto,
    res: Response,
    userId: string,
    operation:string
  ): Promise<void> {
    const {
      marketTypeId,
      brokerId,
      brokerAccountName,
      orderType,
      symbol,
      allowedDirection,
      marginTypes,
      maxLeverage,
      maxRiskPercentage,
      orderPlacingType,
      entryPrice,
      stopLoss,
      targetPrice,
      orderId,
    } = createOrderDto;

    // Step 1: Validate Common Requirements
    const commonValidation = await this.validateCommon(
      marketTypeId,
      brokerId,
      brokerAccountName,
      userId,
      orderType,
      res,
    );
    if (!commonValidation) return;

    const { marketTypeName, brokerName, tradingRules, apiKey, secretKey } = commonValidation;

    // Step 2: Validate Cancel Pending Order Rules
    const currentTime = moment().utc().format('HH:mm:ss');

    // Validate orderId
    if (!orderId || isNaN(Number(orderId))) {
      const errorMessage = 'Invalid or missing orderId';
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Rule 1: Validate pendingOrderModifyBlockPeriod
    if (tradingRules.pendingOrderModifyBlockPeriod) {
      const [startTime, endTime] = tradingRules.pendingOrderModifyBlockPeriod
        .split(',')
        .map((t: string) => t.trim());
      if (!moment(startTime, 'HH:mm:ss', true).isValid() || !moment(endTime, 'HH:mm:ss', true).isValid()) {
        const errorMessage = 'Invalid pendingOrderModifyBlockPeriod format in trading rules.';
        console.log(errorMessage);
        res.status(400).json({
          statusCode: 400,
          message: errorMessage,
          consoleMessage: errorMessage,
          success: false,
        });
        return;
      }
      if (startTime <= endTime) {
        if (currentTime >= startTime && currentTime <= endTime) {
          const errorMessage = `Order cancellation blocked during ${startTime} - ${endTime} UTC.`;
          console.log(errorMessage);
          res.status(400).json({
            statusCode: 400,
            message: errorMessage,
            consoleMessage: errorMessage,
            success: false,
          });
          return;
        }
      } else {
        if (currentTime >= startTime || currentTime <= endTime) {
          const errorMessage = `Order cancellation blocked during ${startTime} - ${endTime} UTC (midnight crossover).`;
          console.log(errorMessage);
          res.status(400).json({
            statusCode: 400,
            message: errorMessage,
            consoleMessage: errorMessage,
            success: false,
          });
          return;
        }
      }
    }

    // Rule 2: Validate maxPendingOrder (optional, if cancellation affects pending order limits)
    if (tradingRules.maxPendingOrder) {
      const pendingOrders = await this.orderPlacementModel.countDocuments({
        userId,
        status: 'pending',
      });
      // Example: Ensure cancellation doesn't trigger an immediate new order that violates limits
    }

    // Step 3: Route to Broker via BrokerFactory
    let brokerInstance;
    try {
      brokerInstance = this.brokerFactory.getBroker(marketTypeName, brokerName,orderType,operation);
      console.log('Broker Instance:', brokerInstance);
    } catch (error) {
      const errorMessage = `Invalid market type or broker: ${error.message}`;
      console.log(errorMessage);
      res.status(400).json({
        statusCode: 400,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
      return;
    }

    // Step 4: Pass Data to Broker Service
    try {
      const brokerOrder = await brokerInstance(userId, apiKey, secretKey,brokerAccountName, {
        symbol,
        orderId: Number(orderId),
      });

      const successMessage = '✅ Pending order cancelled successfully.';
      console.log(successMessage);
      res.status(200).json({
        statusCode: 200,
        message: successMessage,
        consoleMessage: successMessage,
        success: true,
        data: brokerOrder,
      });
    } catch (error) {
      const errorMessage = `Failed to cancel pending order: ${error.message}`;
      console.log(errorMessage);
      res.status(500).json({
        statusCode: 500,
        message: errorMessage,
        consoleMessage: errorMessage,
        success: false,
      });
    }
  }
}
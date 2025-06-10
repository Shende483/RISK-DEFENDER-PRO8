import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BrokerAccount, BrokerAccountDocument } from './sub-broker-account.schema';
import { Model, Types } from 'mongoose';
import { Response } from 'express';
import { User, UserDocument } from 'src/modules/auth/updateUserInfoAuth/UserUpdateInfo.schema';
import { Broker, BrokerDocument } from '../../adminModules/BrokerManagment/broker.schema';
import { MarketType, MarketTypeSchema } from '../../adminModules/MarketType/marketType.schema';
import { SubBrokerAccountDto } from './sub-broker-account-dto';
import { SubbrokerPayment, SubbrokerPaymentDocument } from 'src/modules/payment-management/payment-type-schema/subbroker-payment.schema';
import { Kafka, Producer } from 'kafkajs';
import { ApiKeyVerificationService } from './api-secret-verification.service';
import { ProxyService, ProxyServiceDocument } from 'src/modules/proxy-service-management/proxy-management.schema';

@Injectable()
export class SubBrokerAccountService {
  private producer: Producer;

  constructor(
    @InjectModel(ProxyService.name) 
    private readonly proxyServiceModel: Model<ProxyServiceDocument>,
    private readonly apiKeyVerificationService: ApiKeyVerificationService,
    @InjectModel(BrokerAccount.name)
    private readonly brokerAccountModel: Model<BrokerAccountDocument>,
    @InjectModel(Broker.name)
    private readonly brokerModel: Model<BrokerDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(MarketType.name)
    private readonly marketTypeModel: Model<MarketTypeSchema>,
    @InjectModel(SubbrokerPayment.name)
    private readonly subbrokerPaymentModel: Model<SubbrokerPaymentDocument>,
    @Inject('KAFKA_CLIENT') private readonly kafka: Kafka,
  ) {
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
  }



  async getBrokerListByMarketType(userId: string, marketTypeId: string) {
    try {
      console.log('Received request for broker details', { userId, marketTypeId });
      const brokers = await this.brokerModel
        .find({
          marketTypeId: marketTypeId,
          status: 'active',
        })
        .select('_id name')
        .exec();
      console.log('Fetched brokers:', brokers);

      if (!brokers || brokers.length === 0) {
        return {
          statusCode: 404,
          message: 'No active brokers found for the given market type',
          success: false,
          data: [],
        };
      }

      return {
        statusCode: 200,
        message: 'Broker details retrieved successfully',
        success: true,
        data: brokers.map((broker) => ({
          _id: broker._id.toString(),
          name: broker.name,
        })),
      };
    } catch (error) {
      console.error('Error fetching broker details:', error);
      return {
        statusCode: 500,
        message: 'Error fetching broker details',
        success: false,
        data: [],
      };
    }
  }





  async validateSubaccountName(
    userId: string,
    marketTypeId: string,
    brokerId: string,
    subAccountName: string,
    res: Response,
  ) {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }
      if (!['stockmarket', 'cryptocurrency', 'forex'].includes(marketTypeId)) {
        throw new Error('Invalid market type');
      }
      if (!Types.ObjectId.isValid(brokerId)) {
        throw new Error('Invalid broker ID');
      }
      if (!subAccountName || typeof subAccountName !== 'string') {
        throw new Error('Invalid subaccount name');
      }

      const brokerAccount = await this.brokerAccountModel
        .findOne({
          userId: new Types.ObjectId(userId),
          marketTypeId,
          brokerId: new Types.ObjectId(brokerId),
          subAccountName: subAccountName,
        });

      if (brokerAccount) {
        return res.status(201).json({
          statusCode: 400,
          success: false,
          message: 'Subaccount name already exists, please choose a different name',
        });
      } else {
        console.log("mybrokenull,", brokerAccount);
        return res.status(200).json({
          statusCode: 200,
          success: true,
          message: 'Subaccount name is available',
        });
      }
    } catch (error) {
      console.error('Error validating subaccount name:', error);
      return res.status(200).json({
        statusCode: 500,
        success: false,
        message: 'Failed to validate subaccount name',
      });
    }
  }







// Adding Trading Rule Page 

  async getSubBrokerAccountsByUser(userId: string) {
    try {
      console.log('Fetching subbroker accounts for user:', userId);

      if (!Types.ObjectId.isValid(userId)) {
        return {
          statusCode: 400,
          message: 'Invalid user ID',
          success: false,
          data: [],
        };
      }

      const accounts = await this.brokerAccountModel
        .find({ userId: new Types.ObjectId(userId), status: 'inactive' })
        .populate('brokerId', 'name key', this.brokerModel)
        .populate('currentBrokerPaymentId', 'startDate endDate', this.subbrokerPaymentModel)
        .populate('proxyServiceId', 'ip4 ipProvider status ipStart ipExpiry', this.proxyServiceModel)
        .exec();

      if (!accounts || accounts.length === 0) {
        return {
          statusCode: 200,
          message: 'No sub-broker accounts found for adding rules',
          success: false,
          data: [],
        };
      }

      const currentDate = new Date();

      const formattedAccounts = accounts
        .filter((account) => {
          if (account.currentBrokerPaymentId) {
            const payment = account.currentBrokerPaymentId as any;
            const endDate = payment.endDate ? new Date(payment.endDate) : null;
            return !endDate || endDate >= currentDate;
          }
          return true;
        })
        .map((account) => ({
          _id: account._id.toString(),
          marketTypeId: account.marketTypeId || 'Unknown',
          brokerId: account.brokerId ? (account.brokerId as unknown as { _id: Types.ObjectId; name: string; key: string })._id.toString() : 'Unknown',
          brokerName: account.brokerId ? (account.brokerId as any).name : 'NotFound',
          brokerKey: account.brokerId ? (account.brokerId as any).key : 'NotFound',
          subAccountName: account.subAccountName,
          startDate: account.currentBrokerPaymentId ? (account.currentBrokerPaymentId as any).startDate?.toISOString() : 'NotFound',
          endDate: account.currentBrokerPaymentId ? (account.currentBrokerPaymentId as any).endDate?.toISOString() : '',
          hasProxy: !!account.proxyServiceId,
          proxyServiceId: account.proxyServiceId ? (account.proxyServiceId as any)._id.toString() : 'NotFound',
        }));

      console.log("fgfffffffffffff", formattedAccounts);

      return {
        statusCode: 200,
        message: 'Subbroker accounts retrieved successfully',
        success: true,
        data: formattedAccounts,
      };
    } catch (error) {
      console.error('Error fetching subbroker accounts:', error);
      return {
        statusCode: 500,
        message: 'Error fetching subbroker accounts',
        success: false,
        data: [],
      };
    }
  }






//check when user verify
  async verifyMainKeys(
    body: {
      brokerKey: string;
      marketTypeId: string;
      mainApiKey: string;
      mainSecretKey: string;
    },
    userId: string,
    res: Response,
  ): Promise<void> {
    const { brokerKey, marketTypeId, mainApiKey, mainSecretKey } = body;
    try {
      const verificationResult = await this.apiKeyVerificationService.verifyMainApiSecret(
        { brokerKey, marketTypeId, mainApiKey, mainSecretKey },
        userId,
      );
      res.status(200).json({
        statusCode: verificationResult.statusCode,
        message: verificationResult.message,
        success: verificationResult.success,
      });
    } catch (error) {
      console.error('❌ Error verifying Main Account API keys:', error);
      res.status(200).json({
        statusCode: 500,
        message: 'Failed to verify Main Account API keys',
        success: false,
      });
    }
  }





//check when user verify
  async verifySubKeys(
    body: {
      brokerKey: string;
      marketTypeId: string;
      subApiKey: string;
      subSecretKey: string;
    },
    userId: string,
    res: Response,
  ): Promise<void> {
    const { brokerKey, marketTypeId, subApiKey, subSecretKey } = body;
    try {
      const verificationResult = await this.apiKeyVerificationService.verifySubApiSecret(
        { brokerKey, marketTypeId, subApiKey, subSecretKey },
        userId,
      );
      res.status(200).json({
        statusCode: verificationResult.statusCode,
        message: verificationResult.message,
        success: verificationResult.success,
      });
    } catch (error) {
      console.error('❌ Error verifying Sub-Account API keys:', error);
      res.status(200).json({
        statusCode: 500,
        message: 'Failed to verify Sub-Account API keys',
        success: false,
      });
    }
  }





//final req send by user
  async setTradingRules(
    safeBody: {
      _id: string;
      marketTypeId: string;
      brokerKey: string;
      subApiKey: string;
      subSecretKey: string;
      mainApiKey: string;
      mainSecretKey: string;
      proxyServiceId: string;
      noRulesChange: boolean;
      tradingRuleData: any;
    },
    userId: string,
    res: Response,
  ): Promise<void> {
    try {
      const {
        _id,
        marketTypeId,
        brokerKey,
        subApiKey,
        subSecretKey,
        mainApiKey,
        mainSecretKey,
        proxyServiceId,
        noRulesChange,
        tradingRuleData,
      } = safeBody;

      console.log('hfghhjfjhd', safeBody);

      const brokerAccount = await this.brokerAccountModel.findById(_id);
      console.log("ggggggggggg", brokerAccount);
      if (!brokerAccount) {
        res.status(200).json({
          statusCode: 400,
          message: 'BrokerAccount not exist',
          success: false,
        });
        return;
      }
      const proxy = await this.proxyServiceModel.findById(proxyServiceId);
      console.log("ggggggggggg", proxy);
      if (!proxy) {
        res.status(200).json({
          statusCode: 400,
          message: 'ProxyServiceId not exist',
          success: false,
        });
        return;
      }

      // Verify Main API keys
      const mainVerification = await this.apiKeyVerificationService.verifyMainApiSecret(
        { brokerKey, marketTypeId, mainApiKey, mainSecretKey },
        userId
      ).catch(error => {
        console.error('❌ Main API verification failed:', error);
        res.status(200).json({
          statusCode: 500,
          message: '❌ Failed to verify Main Account API keys',
          success: false,
        });
        throw error;
      });

      if (!mainVerification.success) {
        res.status(200).json({
          statusCode: mainVerification.statusCode,
          message: mainVerification.message,
          success: false,
        });
        return;
      }

      // Verify Sub API keys
      const subVerification = await this.apiKeyVerificationService.verifySubApiSecret(
        { brokerKey, marketTypeId, subApiKey, subSecretKey },
        userId
      ).catch(error => {
        console.error('❌ Sub API verification failed:', error);
        res.status(200).json({
          statusCode: 500,
          message: '❌ Failed to verify Sub-Account API keys',
          success: false,
        });
        throw error;
      });

      if (!subVerification.success) {
        res.status(200).json({
          statusCode: subVerification.statusCode,
          message: subVerification.message,
          success: false,
        });
        return;
      }

      // Prepare data for Kafka
      const kafkaData = {
        _id,
        mainApiKey,
        mainSecretKey,
        subApiKey,
        subSecretKey,
        noRulesChange,
        tradingRuleData,
        createdAt: new Date().toISOString(),
      };

      await this.producer.send({
        topic: 'broker_account_rules_add',
        messages: [
          {
            value: JSON.stringify(kafkaData),
          },
        ],
      });

      console.log('✅ Sent broker account data to Kafka:', kafkaData);

      res.status(200).json({
        statusCode: 200,
        message: '✅ Broker account creation request queued successfully.',
        success: true,
      });
    } catch (error) {
      console.error('❌ Error sending to Kafka:', error);
      res.status(200).json({
        statusCode: 500,
        message: '❌ Something went wrong. Broker account creation request failed.',
        success: false,
      });
    }
  }




//renew broker account data

async getExpiredBrokerAccounts(userId: string) {
    try {
      console.log('Fetching expired broker accounts for user:', userId);

      if (!Types.ObjectId.isValid(userId)) {
        return {
          statusCode: 400,
          message: 'Invalid user ID',
          success: false,
          data: [],
        };
      }

      const accounts = await this.brokerAccountModel
        .find({ userId: new Types.ObjectId(userId) })
        .populate('brokerId', 'name', this.brokerModel)
        .populate('currentBrokerPaymentId', 'startDate endDate paymentStatus planStatus', this.subbrokerPaymentModel)
        .exec();

      if (!accounts || accounts.length === 0) {
        return {
          statusCode: 200,
          message: 'No broker accounts found for user',
          success: false,
          data: [],
        };
      }

      console.log("hhhhhhhhhhhhhhhhhh", accounts);

      const currentDate = new Date();

      const expiredAccounts = accounts
        .filter((account) => {
          if (account.currentBrokerPaymentId) {
            const payment = account.currentBrokerPaymentId as any;
            const endDate = payment.endDate ? new Date(payment.endDate) : null;
            return endDate && endDate < currentDate && payment.paymentStatus === 'success';
          }
          return false;
        })
        .map((account) => ({
          _id: account._id.toString(),
          subAccountName: account.subAccountName,
          marketTypeId: account.marketTypeId || 'Unknown',
          brokerName: account.brokerId ? (account.brokerId as any).name : 'Unknown',
          startDate: account.currentBrokerPaymentId ? (account.currentBrokerPaymentId as any).startDate?.toISOString() : '',
          endDate: account.currentBrokerPaymentId ? (account.currentBrokerPaymentId as any).endDate?.toISOString() : '',
          status: account.status,
        }));

      console.log('exxxxxxxxxxxxxxxxxxxxeeeeeeeeeee', expiredAccounts);

      return {
        statusCode: 200,
        message: expiredAccounts.length > 0 ? 'Expired broker accounts retrieved successfully' : 'No expired broker accounts found',
        success: expiredAccounts.length > 0,
        data: expiredAccounts,
      };
    } catch (error) {
      console.error('Error fetching expired broker accounts:', error);
      return {
        statusCode: 500,
        message: 'Error fetching expired broker accounts',
        success: false,
        data: [],
      };
    }
  }






}
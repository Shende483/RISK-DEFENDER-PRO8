import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BrokerAccount, BrokerAccountDocument } from './trading-dashboard.schema';
import { Model, Types } from 'mongoose';

import { Response } from 'express';
import { BrokerAccountDto } from './dto/trading-dashboard.dto';
import {
  User,
  UserDocument,
} from 'src/modules/auth/updateUserInfoAuth/UserUpdateInfo.schema';
import {
  Broker,
  BrokerDocument,
} from '../../adminModules/BrokerManagment/broker.schema';
import {
  MarketType,
  MarketTypeSchema,
} from '../../adminModules/MarketType/marketType.schema';

const ObjectId = Types.ObjectId;

@Injectable()
export class BrokerAccountService {
  constructor(
    @InjectModel(BrokerAccount.name)
    private readonly brokerAccountModel: Model<BrokerAccountDocument>,
    @InjectModel(Broker.name)
    private readonly brokerModel: Model<BrokerDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(MarketType.name)
    private readonly marketTypeModel: Model<MarketTypeSchema>,
    
  ) {}

  async createBrokerAccount(
    brokerAcoountdto: BrokerAccountDto,
    res: Response,
  ): Promise<BrokerAccount | void> {
    const {
      brokerId,
      marketTypeId,
      userId,
      subAccountName,
      apiKey,
      secretKey,
      status,
      tradingRuleData,
    } = brokerAcoountdto;








const marketType = await this.marketTypeModel.findById(marketTypeId);
    if (!marketType) {
      res.status(400).json({
        statusCode: 400,
        messege: 'Market type does not exist',
        status: false,
      });
    }




    const brokerType = await this.brokerModel.findById(
      brokerAcoountdto.brokerId,
    );
    if (!brokerType) {
      res.status(400).json({
        statusCode: 400,
        messege: 'Broker type does not exist',
        status: false,
      });
    }
   
    const userType = await this.userModel.findById(userId);
    if (!userType) {
      res.status(400).json({
        statusCode: 400,
        messege: 'user type does not exist',
        status: false,
      });
    }
    

    try {
      const newBrokerAcc = new this.brokerAccountModel({
        brokerId,
        marketTypeId,
       
        userId,
        subAccountName,
        apiKey,
        secretKey,
        status,
        tradingRuleData,
      });
      const savedBrokerAccount = await newBrokerAcc.save();
      console.log(
        '✅ Broker Account created successfully:',
        savedBrokerAccount,
      );

      res.status(200).json({
        statusCode: 200,
        message: '✅ Broker Account created successfully.',
        success: true,
        data: savedBrokerAccount._id,
      });
  
    } catch (error) {
      console.error('❌ Error saving broker:', error);
      res.status(500).json({
        statusCode: 500,
        message: '❌ Something went wrong. Broker Account not saved.',
        success: false,
      });
    }
  }



  async getBrokerDetailsByUserIdAndMarketType(
    userId: string,
    marketTypeId: string,
  ) {
    try {

console.log('we recieved req for broker details');
      const brokerAccounts = await this.brokerAccountModel
        .find({
          marketTypeId: marketTypeId,
          userId: new ObjectId(userId),
          brokerId: { $exists: true, $ne: null },
        })
        .populate<{ brokerId: Pick<Broker, 'name'> | null }>('brokerId', 'name')
        .select('_id brokerAccountName') // Added _id here
        .exec();

           console.log('account', brokerAccounts,userId);
      return brokerAccounts.map((account) => {
     
        if (!account.brokerId) {
          console.log(
            `Broker account ${account._id} has no valid broker reference`,
          );
          return {
            statusCode: 401,
            _id: account._id.toString(), // Added ID here
            brokerAccountName: account.subAccountName,
            brokerName: 'Unknown Broker',
            message: 'Broker reference missing',
            success: false,
          };
        }
        return {
          statusCode: 200,
          _id: account._id.toString(), // Added ID here
          brokerAccountName: account.subAccountName,
          brokerName: account.brokerId.name,
          success: true,
        };
      });
    } catch (error) {
      console.error('Error fetching broker details:', error);
      return {
        statusCode: 401,
        message: 'Error fetching broker details',
        success: false,
      };
    }
  }

  // brokerAccount.service.ts

// get subbrokername
async getSubBrokerDetailsByMarketTypeAndBrokerId(
    userId: string,
    marketTypeId: string,
    brokerId: string,
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

      const brokerAccounts = await this.brokerAccountModel
        .find({
          userId: new Types.ObjectId(userId),
          marketTypeId,
          brokerId: new Types.ObjectId(brokerId),
        })
        .select('_id brokerAccountName')
        .lean()
        .exec();

        console.log('brokerAccounts', brokerAccounts);

      if (!brokerAccounts.length) {
        throw new Error('No sub-broker accounts found');
      }
      return brokerAccounts.map((account) => ({
        statusCode: 200,
        _id: account._id.toString(),
        brokerAccountName: account.subAccountName,
        success: true,
      }));
    } catch (error) {
      console.error('Error fetching sub-broker details:', error);
      throw new Error(error.message || 'Failed to retrieve sub-broker details');
    }
  }



// get trading rules
  async getTradingRules(
  userId: string,
  subBrokerId: string,
  tradingType: string,
) {
  try {
    // Validate inputs
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }
    
    if (!Types.ObjectId.isValid(subBrokerId)) {
      throw new Error('Invalid sub-broker ID');
    }
    if (!tradingType || !['cash', 'option', 'future'].includes(tradingType)) {
      throw new Error('Invalid trading type');
    }

    // Fetch broker account
    const brokerAccount = await this.brokerAccountModel
      .findOne({
        _id: new Types.ObjectId(subBrokerId),
        userId: new Types.ObjectId(userId),
        [`tradingRuleData.${tradingType}`]: { $exists: true }, // Ensure specific trading rules exist
      })
      .select(`tradingRuleData.${tradingType} brokerAccountName`)
      .lean();  
    if (!brokerAccount) {
      throw new Error('Broker account not found');
    }

    const tradingRules = brokerAccount.tradingRuleData?.[tradingType] || [];
    const parsedRules = this.parseTradingRules(tradingRules);
    console.log('Parsed trading rules:', parsedRules);
    return {
      statusCode: 200,
      message: 'Trading rules retrieved successfully',
      success: true,
      data: parsedRules,
    };

  } catch (error) {
    console.error('Error fetching trading rules:', error);
    throw new Error(error.message || 'Failed to retrieve trading rules');
  }
}

private parseTradingRules(rules: any[]) {
  return rules.map((rule) => {
    if (typeof rule === 'object' && rule !== null) {
      return {
        key: rule.key || '',
        value: rule.value || '',
      };
    }
    if (typeof rule === 'string') {
      const [key, value] = rule.split(':').map((item) => item.trim());
      return { key, value };
    }
    // Fallback for invalid rule
    console.warn('Invalid rule format:', rule);
    return { key: '', value: '' };
  });
}

}





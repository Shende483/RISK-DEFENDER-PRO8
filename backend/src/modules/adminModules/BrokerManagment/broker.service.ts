import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Broker } from './broker.schema';
import { CreateBrokerDto } from './dto/broker.dto';
import { Response } from 'express';
import { MarketType } from '../MarketType/marketType.schema';
import { UpdateBrokerDto } from './dto/updatebroker.dto';
import { Types } from 'mongoose';
import { BrokerAccount, BrokerAccountDocument } from 'src/modules/sidebar-management/trading-dashboard-management/trading-dashboard.schema';

const ObjectId = Types.ObjectId;

export interface BrokerResponse {
  _id: string;
  name: string;
}

@Injectable()
export class BrokersService {
  deleteBroker(id: string, res: Response<any, Record<string, any>>) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectModel(Broker.name) private brokerModel: Model<Broker>,
    @InjectModel(MarketType.name) private marketTypeModel: Model<MarketType>,
    @InjectModel(BrokerAccount.name)
    private brokerAccountModel: Model<BrokerAccountDocument>,
  ) {}

  async createBroker(
    createBrokerDto: CreateBrokerDto,
    res: Response,
  ): Promise<Broker | void> {
    const { marketTypeId, name, status = 'active' } = createBrokerDto;

    const marketType = await this.marketTypeModel.findById(marketTypeId);
    if (!marketType) {
      res.status(400).json({
        statusCode: 400,
        message: '❌ Market type does not exist.',
        success: false,
      });
    }

    try {
      const newBroker = new this.brokerModel({
        name,
        status,
        marketTypeId: marketTypeId,
      });
      const savedBroker = await newBroker.save();
      console.log('✅ Broker created successfully:', savedBroker);

      res.status(200).json({
        statusCode: 200,
        message: '✅ Broker created successfully.',
        success: true,
        data: savedBroker,
      });
    } catch (error) {
      console.error('❌ Error saving broker:', error);
      res.status(500).json({
        statusCode: 500,
        message: '❌ Something went wrong. Broker not saved.',
        success: false,
      });
    }
  }

  async getActiveBrokers(): Promise<Broker[] | { messege: string }> {
    // return this.brokerModel.find({ status: 'active' }).exec();
    const activebroker = await this.brokerModel
      .find({ status: 'active' })
      .exec();
    if (activebroker.length === 0) {
      return { messege: ' No active broker found' };
    }
    return activebroker;
  }

  async updateBroker(updateBrokerDto: UpdateBrokerDto, res: Response) {
    try {
      const updatedBrokers = await this.brokerModel.findByIdAndUpdate(
        updateBrokerDto._id,
        { name: updateBrokerDto.name, status: updateBrokerDto.status },
        { new: true },
      );

      if (!updatedBrokers) {
        return res.status(404).json({
          statusCode: 404,
          message: '❌ Broker not found.',
          success: false,
        });
      }

      res.status(200).json({
        statusCode: 200,
        message: '✅ Broker updated successfully.',
        success: true,
        data: updatedBrokers,
      });
    } catch (error) {
      console.error('❌ Error updating plan:', error);
      res.status(500).json({
        statusCode: 500,
        message: '❌ Something went wrong.',
        success: false,
      });
    }
  }

  async deleteByIdBroker(id: string, res: Response) {
    try {
      const deletedBroker = await this.brokerModel.findByIdAndDelete(id);

      if (!deletedBroker) {
        return res.status(404).json({
          statusCode: 404,
          message: '❌ Broker not found.',
          success: false,
        });
      }

      res.status(200).json({
        statusCode: 200,
        message: '✅ Broker delete successfully.',
        success: true,
        data: deletedBroker,
      });
    } catch (error) {
      console.error('❌ Error deleteing  plan:', error);
      res.status(500).json({
        statusCode: 500,
        message: '❌ Something went wrong.',
        success: false,
      });
    }
  }


  // get market types
  async getBrokersByMarketTypeId(
    marketTypeId: string,
  ): Promise<BrokerResponse[]> {
    try {
      const brokers = await this.brokerModel
        .find({ marketTypeId: new ObjectId(marketTypeId), status: 'active' })
        .select('_id name')
        .exec();

      return brokers.map((broker) => ({
        _id: broker._id.toString(),
        name: broker.name,
      }));
    } catch (error) {
      console.error('Error fetching brokers:', error);
      throw error;
    }
  }



  
  async getBrokerDetailsByUserIdAndMarketType(
    userId: string,
    marketTypeId: string,
  ) {
    try {
      const brokerAccounts = await this.brokerAccountModel
        .find({
          marketTypeId: new ObjectId(marketTypeId),
          userId: new ObjectId(userId),
          brokerId: { $exists: true, $ne: null },
        })
        .populate<{ brokerId: Pick<Broker, 'name'> | null }>('brokerId', 'name')
        .select('brokerAccountName')
        .exec();

      return brokerAccounts.map((account) => {
        if (!account.brokerId) {
          console.log(
            `Broker account ${account._id} has no valid broker reference`,
          );
          return {
            statusCode: 401,
            brokerAccountName: account.subAccountName,
            brokerName: 'Unknown Broker',
            message: 'Broker reference missing',
            success: false,
          };
        }
        console.log('brokerAccounts', brokerAccounts);
        return {
          statusCode: 200,
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
}

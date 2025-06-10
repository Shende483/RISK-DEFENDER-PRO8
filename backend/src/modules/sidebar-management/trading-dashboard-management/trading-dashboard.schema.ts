/*

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type BrokerAccountDocument = HydratedDocument<BrokerAccount>;
@Schema({ timestamps: true })
export class BrokerAccount {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Broker',
    required: true,
  })
  brokerId: MongooseSchema.Types.ObjectId;
  
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'MarketType',
    required: true,
  })
  marketTypeId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
  })
  userId?: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Subscription',
    required: true,
  })
  subscriptionId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  brokerAccountName: string;

  @Prop({ required: true })
  apiKey: string;

  @Prop({ required: true })
  secretKey: string;

  @Prop({ default: 'active' })
  status?: string;

  @Prop({
    type: {
      cash: [{ type: String }],
      option: [{ type: String }],
      future: [{ type: String }],
    },
    required: true,
  })
  tradingRuleData: {
    cash: string[];
    option: string[];
    future: string[];
  };
}

export const BrokerAccountSchema = SchemaFactory.createForClass(BrokerAccount);

*/

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type BrokerAccountDocument = HydratedDocument<BrokerAccount>;

@Schema({ timestamps: true })
export class BrokerAccount {


  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
  })
  userId?: MongooseSchema.Types.ObjectId;

 
 @Prop({ required: true })
  marketTypeId: string;


  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Broker',
    required: true,
  })
  brokerId: MongooseSchema.Types.ObjectId;

    @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Payment',
    required: true,
  })
  paymentId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  subAccountName: string;

  @Prop({ required: true })
  apiKey: string;

  @Prop({ required: true })
  secretKey: string;

  @Prop({ default: 'active' })
  status?: string;

  @Prop({
    type: {
      cash: [
        {
          key: { type: String },
          value: { type: MongooseSchema.Types.Mixed }
        }
      ],
      option: [
        {
          key: { type: String },
          value: { type: MongooseSchema.Types.Mixed }
        }
      ],
      future: [
        {
          key: { type: String },
          value: { type: MongooseSchema.Types.Mixed }
        }
      ],
    },
    required: true,
  })
  tradingRuleData: {
    cash: { key: string; value: any }[];
    option: { key: string; value: any }[];
    future: { key: string; value: any }[];
  };
}

export const BrokerAccountSchema = SchemaFactory.createForClass(BrokerAccount);
export const BrokerAccountModel = BrokerAccountSchema;
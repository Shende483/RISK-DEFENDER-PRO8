

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

@Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SubbrokerPayment' })
  currentBrokerPaymentId: MongooseSchema.Types.ObjectId;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'SubbrokerPayment' }], default: [] })
  brokerPaymentHistoryIds: MongooseSchema.Types.ObjectId[];


@Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'ProxyService',
    required: false,
  })
  proxyServiceId: MongooseSchema.Types.ObjectId; // Ensured no space in field name

  @Prop({ required: true })
  noRulesChange: boolean;

  @Prop({ required: true })
  subAccountName: string;

  @Prop({ required: true })
   mainApiKey: string;

  @Prop({ required: true })
   mainSecretKey: string;

  @Prop({ required: true })
  subApiKey: string;

  @Prop({ required: true })
  subSecretKey: string;

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
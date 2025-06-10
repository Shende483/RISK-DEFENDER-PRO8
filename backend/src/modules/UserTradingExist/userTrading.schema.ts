import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
@Schema({ timestamps: true, collection: 'ActualUserTradingExistingData' })

export class UserExitAccount {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Broker', required: true })
  brokerId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'MarketType',
    required: true,
  })
  marketTypeId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId?: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  brokerAccountName: string;

  @Prop({
    type: {
      cash: {
        type: Map,
        of: MongooseSchema.Types.Mixed,
        default: {},
      },
      option: {
        type: Map,
        of: MongooseSchema.Types.Mixed,
        default: {},
      },
      future: {
        type: Map,
        of: MongooseSchema.Types.Mixed,
        default: {},
      },
    },
    default: {},
  })
  existing: {
    cash: Record<string, any>;
    option: Record<string, any>;
    future: Record<string, any>;
  };

  @Prop({ required: true })
  status: string;
}

export type UserExitAccountDocument = HydratedDocument<UserExitAccount>;
export const UserExitAccountSchema =
  SchemaFactory.createForClass(UserExitAccount);

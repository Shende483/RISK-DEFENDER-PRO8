import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CheckPendingDocument = HydratedDocument<CheckPendingType>;

@Schema({ timestamps: true, collection: 'binance-check-pending' })
export class CheckPendingType {
  @Prop({ type: String, required: true, unique: true })
  clientId: string;

  @Prop({ type: String, required: true })
  api_key: string;

  @Prop({ type: String, required: true })
  api_secret: string;

  @Prop({ type: String, required: true })
  ipAddress: string;

  @Prop({ type: Number, required: true })
  httpPort: number;

  @Prop({ type: String, required: true })
  ipUsername: string;

  @Prop({ type: String, required: true })
  ipPassword: string;

  @Prop({ type: String, required: true })
  symbol: string;

  @Prop({ type: Number, required: true })
  orderId: number;

  @Prop({ type: Number, required: true })
  stopLossPrice: number;

  @Prop({ type: Number, required: true })
  takeProfitPrice: number;

  @Prop({ type: String, required: true })
  quantity: string;

  @Prop({ type: String, enum: ['BUY', 'SELL'], required: true })
  side: string;

  @Prop({ type: Number, required: true })
  riskFactor: number;

}

export const CheckPendingSchema = SchemaFactory.createForClass(CheckPendingType);
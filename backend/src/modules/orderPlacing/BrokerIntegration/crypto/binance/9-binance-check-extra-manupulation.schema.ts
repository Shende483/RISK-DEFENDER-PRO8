import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CheckExtraDocument = HydratedDocument<CheckExtraType>;

@Schema({ timestamps: true, collection: 'binance-check-extra' })
export class CheckExtraType {
  @Prop({ type: String, required: true, unique: true })
  clientId: string;

  @Prop({ type: String, required: true })
  api_key: string;

  @Prop({ type: String, required: true })
  api_secret: string;

  @Prop({ type: String, required: true })
  ipAddress: string;

  @Prop({ type: String, required: true })
  socksPort: string;

  @Prop({ type: Number, required: true })
  httpPort: number;

  @Prop({ type: String, required: true })
  ipUsername: string;

  @Prop({ type: String, required: true })
  ipPassword: string;


}

export const CheckExtraSchema = SchemaFactory.createForClass(CheckExtraType);
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ProxyServiceDocument = HydratedDocument<ProxyService>;

@Schema({ timestamps: true })
export class ProxyService {
  @Prop({
    type: String,
    required: true,
    match: /^(?:\d{1,3}\.){3}\d{1,3}$/,
  })
  ip4: string;

  @Prop({
    type: String,
    required: false,
    match: /^([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}$/,
  })
  ip6?: string;

  @Prop({ type: Number, required: false, min: 1, max: 65535 })
  ip4HttpPort?: number;

  @Prop({ type: Number, required: false, min: 1, max: 65535 })
  ip4HttpsPort?: number;

  @Prop({ type: Number, required: false, min: 1, max: 65535 })
  ip4SocksPort?: number;

  @Prop({ type: Number, required: false, min: 1, max: 65535 })
  ip6HttpPort?: number;

  @Prop({ type: Number, required: false, min: 1, max: 65535 })
  ip6HttpsPort?: number;

  @Prop({ type: Number, required: false, min: 1, max: 65535 })
  ip6SocksPort?: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Broker',
    required: true,
  })
  brokerList: MongooseSchema.Types.ObjectId;


  @Prop({ type: Number, required: true, default: 0 })
  totalBrokers: number;

  @Prop({ type: String, required: false })
  ipUserName?: string;

  @Prop({ type: String, required: false })
  ipPassword?: string;

  @Prop({ type: String, required: true })
  ipProvider: string;

  @Prop({ type: Date, required: true })
  ipStart: Date;

  @Prop({ type: Date, required: true })
  ipExpiry: Date;

  @Prop({ type: String, required: true, enum: ['active', 'inactive'] })
  status: 'active' | 'inactive';
}

export const ProxyServiceSchema = SchemaFactory.createForClass(ProxyService);


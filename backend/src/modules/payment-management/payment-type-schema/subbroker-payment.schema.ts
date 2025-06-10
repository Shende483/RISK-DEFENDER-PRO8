import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type SubbrokerPaymentDocument = HydratedDocument<SubbrokerPayment>;

@Schema({ timestamps: true })
export class SubbrokerPayment {
   

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Plan', required: true })
  planId: MongooseSchema.Types.ObjectId;

  @Prop({ default: '' })
  couponCode: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

   @Prop({ type: String })
   razorpayPaymentId:string

  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true, enum: ['pending', 'success', 'failed'] })
  paymentStatus: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true, enum: ['active', 'inactive', 'expired'] })
  planStatus: string;

  @Prop({ required: true })
  paymentType: string;


}

export const SubbrokerPaymentSchema = SchemaFactory.createForClass(SubbrokerPayment);
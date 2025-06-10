import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CouponDocument = HydratedDocument<Coupon>;

@Schema({ timestamps: { createdAt: 'createdDate', updatedAt: 'modifiedDate' } })
export class Coupon {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  discountPercentage: number;

  @Prop({ default: 'active' })
  status: string;

  @Prop()
  createdDate: Date;

  @Prop()
  modifiedDate: Date;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
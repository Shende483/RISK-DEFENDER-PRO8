import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SubbrokerPlanDocument = HydratedDocument<SubbrokerPlan>;

class Price {
 @Prop({ type: Number, required: true })
  INR: number;

  @Prop({ type: Number, required: true })
  USD: number;

  @Prop({ type: Number, required: true })
  EUR: number;

  @Prop({ type: Number, required: true })
  GBP: number;

  @Prop({ type: Number, required: true })
  AED: number;

  @Prop({ type: Number, required: true })
  SGD: number;

  @Prop({ type: Number, required: true })
  CAD: number;

  @Prop({ type: Number, required: true })
  AUD: number;
}

@Schema({ timestamps: { createdAt: 'createdDate', updatedAt: 'modifiedDate' } })
export class SubbrokerPlan {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  duration: string;

  @Prop({ required: true, type: Number })
  durationInMonths: number;

  @Prop({ required: true, type: Price })
  price: Price;

  @Prop({ type: Number, default: 0 })
  discountPercent: number;

  @Prop({ required: true })
  billingCycle: string;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ required: true })
  description: string;

  @Prop({ type: Number, default: 18 })
  gstRate: number;

  @Prop({ required: true, enum: ['active', 'inactive'], default: 'active' })
  status: string;
}

export const SubbrokerPlanDetailsSchema = SchemaFactory.createForClass(SubbrokerPlan);




/*
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {  HydratedDocument } from 'mongoose';

export type PlanDocument = HydratedDocument<Plan>;

@Schema({ timestamps: { createdAt: 'createdDate', updatedAt: 'modifiedDate' } })
export class Plan  {
   @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  duration: string; // e.g., "1 month", "3 months" (for display purposes)

  @Prop({ required: true, type: Number })
  durationInMonths: number; // e.g., 1, 3, 6, 12 (for calculations)

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ type: Number, default: 0 })
  discountPercent: number;

  @Prop({ required: true })
  billingCycle: string; // e.g., "month"

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ required: true })
  description: string;

  @Prop({ type: Number, default: 18 })
  gstRate: number;

  @Prop({ required: true, enum: ['active', 'inactive'], default: 'active' })
  status: string;
}


export const PlanDetailsSchema = SchemaFactory.createForClass(Plan);
*/
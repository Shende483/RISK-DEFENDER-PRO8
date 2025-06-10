import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Response } from 'express';
import { TradingJournalPlan, TradingJournalPlanDocument } from './trading-journal-plan.schema';
import { Coupon, CouponDocument } from '../common-coupon-plan/coupon-schema';



@Injectable()
export class TradingJournalPlanService {
  constructor(
    @InjectModel(TradingJournalPlan.name) private planModel: Model<TradingJournalPlanDocument>,
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
  ) {}

  async getActivePlan(res: Response) {
    try {
      const plans = await this.planModel.find({ status: 'active' }).exec();
      return res.status(200).json({
        statusCode: 200,
        success: true,
        message: 'Plans retrieved successfully',
        data: plans,
      });
    } catch (error) {
      return res.status(200).json({
        statusCode: 500,
        success: false,
        message: 'Failed to retrieve plans',
        data: [],
      });
    }
  }

  async verifyCoupon(couponCode: string, res: Response) {
    // console.log("my coupon code", couponCode)
    try {
      const coupon = await this.couponModel.findOne({ code: couponCode, status: 'active' }).exec();
      if (!coupon) {
        return res.status(200).json({
          statusCode: 304,
          success: false,
          discountPercentage: 0,
          message: 'Invalid or Expired coupon code',
        });
      }
      return res.status(200).json({
        statusCode: 200,
        success: true,
        discountPercentage: coupon.discountPercentage,
        message: 'Coupon applied successfully',
      });
    } catch (error) {
      return res.status(200).json({
        statusCode: 303,
        success: false,
        discountPercentage: 0,
        message: 'Invalid Or Expired Coupon Entered',
      });
    }
  }
}
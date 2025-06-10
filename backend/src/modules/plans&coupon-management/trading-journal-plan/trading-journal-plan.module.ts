import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TradingJournalPlanController } from './trading-journal-plan.controller';
import { TradingJournalPlanService } from './trading-journal-plan.service';
import { JwtModule } from '@nestjs/jwt';
import jwtConfing from 'src/config/jwt.confing';
import { Coupon, CouponSchema } from '../common-coupon-plan/coupon-schema';
import { TradingJournalPlan, TradingJournalPlanDetailsSchema } from './trading-journal-plan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TradingJournalPlan.name, schema: TradingJournalPlanDetailsSchema },
      { name: Coupon.name, schema: CouponSchema },
    ]),
    JwtModule.registerAsync(jwtConfing.asProvider()),
  ],
  controllers: [TradingJournalPlanController],
  providers: [TradingJournalPlanService],
})
export class TradingJournalPlanModule {}
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertPlan, AlertPlanDetailsSchema } from './alert-plan.schema';

import { AlertPlanController } from './alert-plan.controller';
import { AlertPlanService} from './alert-plan.service';
import { JwtModule } from '@nestjs/jwt';
import jwtConfing from 'src/config/jwt.confing';
import { Coupon, CouponSchema } from '../common-coupon-plan/coupon-schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AlertPlan.name, schema: AlertPlanDetailsSchema },
      { name: Coupon.name, schema: CouponSchema },
    ]),
    JwtModule.registerAsync(jwtConfing.asProvider()),
  ],
  controllers: [AlertPlanController],
  providers: [AlertPlanService],
})
export class AlertPlanModule {}
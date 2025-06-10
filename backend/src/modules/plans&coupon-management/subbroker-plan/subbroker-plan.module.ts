import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubbrokerPlan, SubbrokerPlanDetailsSchema } from './subbroker-plan.schema';
import { Coupon, CouponSchema } from '../common-coupon-plan/coupon-schema';
import { SubbrokerPlanService } from './subbroker-plan.service';
import { JwtModule } from '@nestjs/jwt';
import jwtConfing from 'src/config/jwt.confing';
import { SubrokerPlanController } from './subbroker-plan.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubbrokerPlan.name, schema: SubbrokerPlanDetailsSchema },
      { name: Coupon.name, schema: CouponSchema },
    ]),
    JwtModule.registerAsync(jwtConfing.asProvider()),
  ],
  controllers: [SubrokerPlanController],
  providers: [SubbrokerPlanService],
})
export class SubbrokerPlanModule {}
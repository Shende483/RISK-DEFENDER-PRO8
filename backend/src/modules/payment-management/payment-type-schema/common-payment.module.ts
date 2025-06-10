import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PaymentDetailsController } from '../razorpay-gateway/payment.controller';
import { PaymentService } from '../razorpay-gateway/payment.service';
import { SubbrokerPayment, SubbrokerPaymentSchema } from './subbroker-payment.schema';
import jwtConfing from 'src/config/jwt.confing';
import { Coupon, CouponSchema } from 'src/modules/plans&coupon-management/common-coupon-plan/coupon-schema';
import { SubbrokerPlan, SubbrokerPlanDetailsSchema } from 'src/modules/plans&coupon-management/subbroker-plan/subbroker-plan.schema';
import { KafkaModule } from 'src/common/kafka/kafka.module';
import { BrokerAccount, BrokerAccountSchema } from 'src/modules/sidebar-management/subaccount-management/sub-broker-account.schema';
import { RazorpayService } from 'src/config/razorpay.config';
import { TradingJournalPayment, TradingJournalPaymentSchema } from './trading-journal-payment.schema';
import { AlertPayment, AlertPaymentSchema } from './alert-payment.schema';
import { AlertPlan, AlertPlanDetailsSchema } from 'src/modules/plans&coupon-management/alert-plan/alert-plan.schema';
import { TradingJournalPlan, TradingJournalPlanDetailsSchema } from 'src/modules/plans&coupon-management/trading-journal-plan/trading-journal-plan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubbrokerPayment.name, schema: SubbrokerPaymentSchema },
      { name: TradingJournalPayment.name, schema: TradingJournalPaymentSchema },
      { name: AlertPayment.name, schema: AlertPaymentSchema },
      { name: SubbrokerPlan.name, schema: SubbrokerPlanDetailsSchema },
      { name: AlertPlan.name, schema: AlertPlanDetailsSchema },
      { name: TradingJournalPlan.name, schema: TradingJournalPlanDetailsSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: BrokerAccount.name, schema: BrokerAccountSchema },
    ]),
     KafkaModule,
    JwtModule.registerAsync(jwtConfing.asProvider()),
  ],
  controllers: [PaymentDetailsController],
  providers: [PaymentService,RazorpayService],
})

export class PaymentModule {}
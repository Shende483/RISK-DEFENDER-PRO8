import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { DatabaseConfig } from './config/database.config';
import { KafkaModule } from './common/kafka/kafka.module';
import { LoginModule } from './modules/auth/loginAuth/login.module';
import { RegisterModule } from './modules/auth/registerAuth/register.module';
import { ForgetPasswordModule } from './modules/auth/forgetPasswordAuth/forgetPassword.Module';
import { PaymentModule } from './modules/payment-management/payment-type-schema/common-payment.module';
import { UpdateUserInfoModule } from './modules/auth/updateUserInfoAuth/UserUpdateInfo.module';
import { AdminMarketTypeModule } from './modules/adminModules/MarketType/marketType.module';
import { AdminBrokersModule } from './modules/adminModules/BrokerManagment/broker.module';
import { UserExitAccountModule } from './modules/UserTradingExist/userTrading.module';
import { TradingRulesModule } from './modules/adminModules/TradingRulesManagment/tradingRules.modules';
import { AdminOrderPlacementModule } from './modules/orderPlacement/orderPlacement.module';
import { UserAccountDetailModule } from './modules/adminModules/UserAccountDetail/userAccountDetail.module';
import { OrderSubmitModule } from './modules/orderPlacing/orderSubmit/orderSubmit.module';
import { BrokersModule } from './modules/orderPlacing/BrokerIntegration/brokers.module';
import { RedisModule } from './common/redis.module';
import { BrokerAccountModule } from './modules/sidebar-management/trading-dashboard-management/trading-dashboard.module';
import { SubBrokerAccountModule } from './modules/sidebar-management/subaccount-management/sub-broker-account.module';
import { ProxyModule } from './modules/proxy-service-management/proxy-management.module';
import { SubbrokerPlanModule } from './modules/plans&coupon-management/subbroker-plan/subbroker-plan.module';
import { TradingJournalPlanModule } from './modules/plans&coupon-management/trading-journal-plan/trading-journal-plan.module';
import { AlertPlanModule } from './modules/plans&coupon-management/alert-plan/alert-plan.module';



@Module({
  imports: [

    ConfigModule.forRoot({
      envFilePath: '.env', // Explicitly specify .env
      isGlobal: true, // Make ConfigModule global
    }),

    DatabaseConfig,
    RedisModule, //
    KafkaModule,
    LoginModule,
    RegisterModule,
    ForgetPasswordModule,
    PaymentModule,
    UpdateUserInfoModule,
    AdminMarketTypeModule,
    AdminBrokersModule,
    TradingRulesModule,
    BrokerAccountModule,
    AdminOrderPlacementModule,
    UserAccountDetailModule,
    UserExitAccountModule,
    OrderSubmitModule,
    BrokersModule,
    SubBrokerAccountModule,
    ProxyModule,
    SubbrokerPlanModule,
    TradingJournalPlanModule,
    AlertPlanModule
  
  ]
})
export class AppModule {}



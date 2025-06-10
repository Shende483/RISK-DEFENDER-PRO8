import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {OrderSubmitSchema,OrderSubmitType,} from './orderSubmit.schema';
import { MarketType, MarketTypeSchema } from '../../adminModules/MarketType/marketType.schema';
import {Broker ,BrokerSchema} from '../../adminModules/BrokerManagment/broker.schema'

import { JwtModule } from '@nestjs/jwt';
import jwtConfing from 'src/config/jwt.confing';
import { OrderSubmitService } from './orderSubmit.service';
import { OrderSubmitController } from './orderSubmit.controller';
import { BrokersModule } from '../BrokerIntegration/brokers.module';
import { KafkaModule } from 'src/common/kafka/kafka.module';
import { BrokerAccount, BrokerAccountSchema } from 'src/modules/sidebar-management/trading-dashboard-management/trading-dashboard.schema';



@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OrderSubmitType.name, schema: OrderSubmitSchema },
      { name: MarketType.name, schema: MarketTypeSchema },
        { name: Broker.name, schema: BrokerSchema },
      { name: BrokerAccount.name, schema: BrokerAccountSchema },

    ]),
    JwtModule.registerAsync(jwtConfing.asProvider()),
    BrokersModule,
    KafkaModule
    
  ],
  controllers: [OrderSubmitController],
  providers: [OrderSubmitService],
})
export class OrderSubmitModule {}

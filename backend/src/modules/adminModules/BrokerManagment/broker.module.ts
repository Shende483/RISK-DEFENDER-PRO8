import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Broker, BrokerSchema } from './broker.schema';
import { BrokerController } from './broker.controller';
import { BrokersService } from './broker.service';
import { MarketType, MarketTypeSchema } from '../MarketType/marketType.schema';
import { JwtModule } from '@nestjs/jwt';
import jwtConfing from 'src/config/jwt.confing';
import { BrokerAccount, BrokerAccountSchema } from 'src/modules/sidebar-management/trading-dashboard-management/trading-dashboard.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Broker.name, schema: BrokerSchema },
      { name: MarketType.name, schema: MarketTypeSchema },
      { name: BrokerAccount.name, schema: BrokerAccountSchema },
    ]),
    JwtModule.registerAsync(jwtConfing.asProvider()),
  ],
  controllers: [BrokerController],
  providers: [BrokersService],
})
export class AdminBrokersModule {}

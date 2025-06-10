import { Module } from '@nestjs/common';
import { MarketType, MarketTypeSchema } from '../MarketType/marketType.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import jwtConfing from 'src/config/jwt.confing';
import { TradingRulesService } from './tradingRules.service';
import { TradingRules, TradingRulesSchema } from './tradingRules.schema';
import { TradingRulesController } from './tradingRules.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TradingRules.name, schema: TradingRulesSchema }, 
      { name: MarketType.name, schema: MarketTypeSchema },
    ]),
    JwtModule.registerAsync(jwtConfing.asProvider()),
  ],
  controllers: [TradingRulesController],
  providers: [TradingRulesService],
})
export class TradingRulesModule {} 



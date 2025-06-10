import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import jwtConfing from 'src/config/jwt.confing';
import { MarketType, MarketTypeSchema } from './marketType.schema';
import { MarketTypeController } from './marketType.controller';
import { MarketTypeService } from './marketType.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MarketType.name, schema: MarketTypeSchema },
    ]),
    JwtModule.registerAsync(jwtConfing.asProvider()),
  ],
  controllers: [MarketTypeController],
  providers: [MarketTypeService],
})
export class AdminMarketTypeModule {}




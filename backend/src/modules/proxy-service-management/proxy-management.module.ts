import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProxyController } from './proxy-management.controller';
import { ProxyServiceSchema, ProxyService } from './proxy-management.schema';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'ProxyService', schema: ProxyServiceSchema }]),
  ],
  controllers: [ProxyController],
  providers: [ProxyService],
  exports: [MongooseModule],
})
export class ProxyModule {}
import { Module } from '@nestjs/common';
import { BrokerFactory } from './broker.factory';
import { CryptoModule } from './crypto/crypto.module';



@Module({
  imports: [CryptoModule],
  providers: [BrokerFactory],
  exports: [BrokerFactory],
})
export class BrokersModule {}
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaService } from '../../config/kafka.config';
import { KafkaAdminService } from './kafka-admin.service';
import { KafkaProducerService } from './kafka-producer.service';
import { KafkaAdminController } from './kafka.admin.controllers';
import { MongooseModule } from '@nestjs/mongoose';

import { SubbrokerPayment, SubbrokerPaymentSchema } from 'src/modules/payment-management/payment-type-schema/subbroker-payment.schema';
import { BrokerAccount, BrokerAccountSchema } from 'src/modules/sidebar-management/subaccount-management/sub-broker-account.schema';


import { User, UserSchema } from 'src/modules/auth/updateUserInfoAuth/UserUpdateInfo.schema';
import { Broker, BrokerSchema } from 'src/modules/adminModules/BrokerManagment/broker.schema';
import { MarketType, MarketTypeSchema } from 'src/modules/adminModules/MarketType/marketType.schema';
import { SubBrokerAccountKafkaConsumerService } from 'src/modules/sidebar-management/subaccount-management/kafka-services/add-rules-subaccount-kafka-consumer.service';
import { PaymentKafkaConsumerService } from 'src/modules/payment-management/payment-kafka-services/payment&create-subaccount-kafka-consumer.service';
import { TradingJournalPayment, TradingJournalPaymentSchema } from 'src/modules/payment-management/payment-type-schema/trading-journal-payment.schema';
import { AlertPayment, AlertPaymentSchema } from 'src/modules/payment-management/payment-type-schema/alert-payment.schema';


@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: SubbrokerPayment.name, schema: SubbrokerPaymentSchema },
      { name: TradingJournalPayment.name, schema: TradingJournalPaymentSchema },
      { name: AlertPayment.name, schema: AlertPaymentSchema },
      { name: BrokerAccount.name, schema: BrokerAccountSchema },
      { name: Broker.name, schema: BrokerSchema },
      { name: User.name, schema: UserSchema },
      { name: MarketType.name, schema: MarketTypeSchema },
    ]),
  ],
  controllers: [KafkaAdminController],
  providers: [
    {
      provide: 'KAFKA_CLIENT',
      useFactory: KafkaService.useFactory,
      inject: KafkaService.inject,
    },
    KafkaService,
    KafkaAdminService,
    KafkaProducerService,
    PaymentKafkaConsumerService,
    SubBrokerAccountKafkaConsumerService,
  ],
  exports: ['KAFKA_CLIENT', KafkaProducerService, PaymentKafkaConsumerService, SubBrokerAccountKafkaConsumerService],
})
export class KafkaModule {}
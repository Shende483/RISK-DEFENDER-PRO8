import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, logLevel } from 'kafkajs';

@Injectable()
export class KafkaService {
  static provide = 'KAFKA_CLIENT';

  static async useFactory(configService: ConfigService) {
    const brokers = configService.get<string>('KAFKA_BROKERS');
    const username = configService.get<string>('KAFKA_API_KEY');
    const password = configService.get<string>('KAFKA_API_SECRET');

    if (!brokers || !username || !password) {
      throw new Error(
        'Missing Kafka configuration: KAFKA_BROKERS, KAFKA_API_KEY, or KAFKA_API_SECRET',
      );
    }

    const kafka = new Kafka({
      clientId: 'trading-terminal',
      brokers: brokers.split(',').map(broker => broker.trim()),
      ssl: true,
      sasl: {
        mechanism: 'plain',
        username,
        password,
      },
      logLevel: logLevel.ERROR,
      retry: {
        initialRetryTime: 1000,
        retries: 5, // Retry connection 5 times
      },
    });

    const producer = kafka.producer();
    let retries = 5;
    while (retries > 0) {
      try {
        await producer.connect();
        console.log('✅ Successfully connected to Kafka');
        return kafka;
      } catch (error) {
        console.error(`❌ Attempt ${6 - retries}/5 failed to connect to Kafka: ${error.message}`);
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  static inject = [ConfigService];
}
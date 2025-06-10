
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';

@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  private consumer: Consumer;

  constructor(@Inject('KAFKA_CLIENT') private readonly kafka: Kafka) {
    this.consumer = this.kafka.consumer({
      groupId: 'trading-terminal-group',
      allowAutoTopicCreation: true,
      sessionTimeout: 30000,
      rebalanceTimeout: 60000,
      heartbeatInterval: 3000,
    });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: 'nestjs-topic', fromBeginning: true });
      console.log('Kafka consumer initialized for nestjs-topic');

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const value = message.value ? JSON.parse(message.value.toString()) : null;
            console.log(`Received message from ${topic} [partition ${partition}]:`, value);
            // Process message (e.g., save to database)
          } catch (error) {
            console.error('Failed to process message:', error);
            throw error;
          }
        },
      });
    } catch (error) {
      console.error('Kafka consumer initialization failed:', error);
      throw error;
    }
  }
}

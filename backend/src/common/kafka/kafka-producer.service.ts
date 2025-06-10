

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit {
  private producer: Producer;

  constructor(@Inject('KAFKA_CLIENT') private readonly kafka: Kafka) {
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      console.log('Kafka producer connected');
    } catch (error) {
      console.error('Kafka producer connection failed:', error);
      throw error;
    }
  }

  async sendMessage(topic: string, message: any): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [{ key: null, value: JSON.stringify(message) }],
      });
      console.log(`Message sent to ${topic}:`, message);
    } catch (error) {
      console.error(`Failed to send message to ${topic}:`, error);
      throw error;
    }
  }
}


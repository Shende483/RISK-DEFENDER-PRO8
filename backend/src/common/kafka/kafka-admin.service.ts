

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Kafka, Admin } from 'kafkajs';
import { Inject } from '@nestjs/common';

@Injectable()
export class KafkaAdminService implements OnModuleInit {
  createTopic() {
    throw new Error('Method not implemented.');
  }
  private readonly logger = new Logger(KafkaAdminService.name);
  private admin: Admin;

  constructor(@Inject('KAFKA_CLIENT') private readonly kafka: Kafka) {
    this.admin = this.kafka.admin();
  }

  async onModuleInit() {
    try {
      await this.admin.connect();
      this.logger.log('Kafka admin client connected');

      // Get cluster metadata
      const clusterMetadata = await this.admin.describeCluster();
      const numBrokers = clusterMetadata.brokers.length;
      this.logger.log(`Kafka cluster has ${numBrokers} broker(s)`);

      // Use Confluent Cloud default replication factor (3) or lower if fewer brokers
      const replicationFactor = Math.min(numBrokers, 3);

      // Define payment-related topics
      const topics = [
        { topic: 'payment_initiation', numPartitions: 3, replicationFactor },
        { topic: 'payment_verification', numPartitions: 3, replicationFactor },
        { topic: 'broker_account', numPartitions: 3, replicationFactor },
        {topic:'broker_account_rules_add', numPartitions: 3, replicationFactor}
      ];

      // Create topics with retries
      for (const config of topics) {
        await this.createTopicWithRetry(config, 5, 10000); // 5 retries, 10s delay
      }

      // Verify topic creation
      const existingTopics = await this.listTopics();
      const requiredTopics = topics.map(t => t.topic);
      const missingTopics = requiredTopics.filter(t => !existingTopics.includes(t));
      if (missingTopics.length > 0) {
        throw new Error(`Failed to create topics: ${missingTopics.join(', ')}`);
      }
      this.logger.log('All required topics created:', requiredTopics.join(', '));
    } catch (error) {
      this.logger.error('Kafka admin initialization failed:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.admin.disconnect();
    this.logger.log('Kafka admin client disconnected');
  }

  async createTopicWithRetry(
    config: {
      topic: string;
      numPartitions: number;
      replicationFactor: number;
      configEntries?: { name: string; value: string }[];
    },
    retries: number,
    delayMs: number,
  ): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const topics = await this.admin.listTopics();
        if (topics.includes(config.topic)) {
          this.logger.warn(`Topic ${config.topic} already exists`);
          return;
        }

        await this.admin.createTopics({
          topics: [
            {
              topic: config.topic,
              numPartitions: config.numPartitions,
              replicationFactor: config.replicationFactor,
              configEntries: config.configEntries || [],
            },
          ],
          waitForLeaders: true,
        });
        this.logger.log(
          `Topic ${config.topic} created with ${config.numPartitions} partitions and replication factor ${config.replicationFactor}`,
        );
        return;
      } catch (error) {
        this.logger.error(
          `Attempt ${attempt}/${retries} failed to create topic ${config.topic}: ${error.message}`,
          error.stack,
        );
        if (attempt === retries) throw error;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  async increasePartitions(topic: string, numPartitions: number): Promise<void> {
    try {
      await this.admin.createPartitions({
        topicPartitions: [{ topic, count: numPartitions }],
      });
      this.logger.log(`Increased partitions for topic ${topic} to ${numPartitions}`);
    } catch (error) {
      this.logger.error(`Failed to increase partitions for topic ${topic}:`, error);
      throw error;
    }
  }

  async listTopics(): Promise<string[]> {
    try {
      const topics = await this.admin.listTopics();
      this.logger.log(`Retrieved topic list: ${topics.join(', ')}`);
      return topics;
    } catch (error) {
      this.logger.error('Failed to list topics:', error);
      throw error;
    }
  }

  async describeTopic(topic: string): Promise<any> {
    try {
      const metadata = await this.admin.fetchTopicMetadata({ topics: [topic] });
      const topicData = metadata.topics.find((t) => t.name === topic);
      if (!topicData) {
        throw new Error(`Topic ${topic} not found`);
      }
      this.logger.log(`Described topic ${topic}: ${JSON.stringify(topicData)}`);
      return topicData;
    } catch (error) {
      this.logger.error(`Failed to describe topic ${topic}:`, error);
      throw error;
    }
  }
}
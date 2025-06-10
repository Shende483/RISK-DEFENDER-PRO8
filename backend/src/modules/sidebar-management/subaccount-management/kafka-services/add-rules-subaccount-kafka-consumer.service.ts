import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BrokerAccount, BrokerAccountDocument } from '../sub-broker-account.schema';
import { User, UserDocument } from 'src/modules/auth/updateUserInfoAuth/UserUpdateInfo.schema';
import { Broker, BrokerDocument } from '../../../adminModules/BrokerManagment/broker.schema';
import { MarketType, MarketTypeSchema } from '../../../adminModules/MarketType/marketType.schema';
import { Kafka, Consumer } from 'kafkajs';
import { Inject } from '@nestjs/common';
import { KafkaAdminService } from 'src/common/kafka/kafka-admin.service';

@Injectable()
export class SubBrokerAccountKafkaConsumerService implements OnModuleInit {
  private readonly logger = new Logger(SubBrokerAccountKafkaConsumerService.name);
  private consumer: Consumer;
  private readonly topics = ['broker_account_rules_add'];

  constructor(
    @InjectModel(BrokerAccount.name)
    private readonly brokerAccountModel: Model<BrokerAccountDocument>,
    @InjectModel(Broker.name)
    private readonly brokerModel: Model<BrokerDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(MarketType.name)
    private readonly marketTypeModel: Model<MarketTypeSchema>,
    @Inject('KAFKA_CLIENT') private readonly kafka: Kafka,
    @Inject(KafkaAdminService) private readonly kafkaAdminService: KafkaAdminService,
  ) {
    this.consumer = this.kafka.consumer({
      groupId: 'sub-broker-account-consumer-group',
      allowAutoTopicCreation: true,
      sessionTimeout: 30000,
      rebalanceTimeout: 60000,
      heartbeatInterval: 3000,
    });
  }

  async onModuleInit() {
    try {
      // Wait for topics to exist
      await this.waitForTopics(15, 10000); // 15 retries, 10s delay

      await this.consumer.connect();
      await this.consumer.subscribe({
        topics: this.topics,
        fromBeginning: true,
      });
      this.logger.log('Kafka consumer initialized for broker account rules topic');

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const data = message.value ? JSON.parse(message.value.toString()) : null;
            this.logger.log(`Received message from ${topic} [partition ${partition}]:`, data);

            if (topic === 'broker_account_rules_add') {
            
 const { _id, subApiKey, subSecretKey, mainApiKey, mainSecretKey,noRulesChange, tradingRuleData, updatedAt } = data;
              // Prepare update data
              const updateData: any = {
                subApiKey,
                subSecretKey,
                mainApiKey,
                mainSecretKey,
                noRulesChange,
                tradingRuleData,
                status:"active",
                updatedAt: new Date(updatedAt),
              };
        
              // Update broker account
              const updatedBrokerAccount = await this.brokerAccountModel.findByIdAndUpdate(
                _id,
                { $set: updateData },
              { new: true, upsert: false }
              );

            this.logger.log('✅ Broker Account Updated in MongoDB:', updatedBrokerAccount);
            }
          } catch (error) {
            this.logger.error(`Failed to process message from ${topic}:`, error);
            throw error;
          }
        },
      });
    } catch (error) {
      this.logger.error('Kafka consumer initialization failed:', error);
      throw error;
    }
  }

  async waitForTopics(maxRetries: number, delayMs: number): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const existingTopics = await this.kafkaAdminService.listTopics();
        const missingTopics = this.topics.filter((topic) => !existingTopics.includes(topic));
        if (missingTopics.length === 0) {
          this.logger.log('All required topics exist:', this.topics.join(', '));
          return;
        }
        this.logger.warn(
          `Missing topics: ${missingTopics.join(', ')}. Attempt ${attempt}/${maxRetries}`,
        );
      } catch (error) {
        this.logger.error(`Failed to check topics on attempt ${attempt}: ${error.message}`, error.stack);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    throw new Error(`Required topics not available after ${maxRetries} attempts: ${this.topics.join(', ')}`);
  }
}







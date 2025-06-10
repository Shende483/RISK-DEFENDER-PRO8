import { createClient } from 'redis';
import { ConfigService } from '@nestjs/config';

export const RedisService = {
  provide: 'REDIS_CLIENT',
  useFactory: async (configService: ConfigService) => {
    const redisUrl = configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      throw new Error('❌ REDIS_URL is not defined in environment variables');
    }

    const client = createClient({ url: redisUrl });
    client.on('error', (err) => console.error('Redis Error:', err));

    let attempt = 1;
    const maxDelay = 30000; // Max delay of 30 seconds
    const maxAttempts = configService.get<number>('REDIS_MAX_RETRIES', 0); // 0 means infinite retries

    while (maxAttempts === 0 || attempt <= maxAttempts) {
      try {
        await client.connect();
        console.log(`✅ Successfully connected to Redis on attempt ${attempt}`);
        return client;
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed to connect to Redis: ${error.message}`);
        if (maxAttempts !== 0 && attempt >= maxAttempts) {
          throw new Error(`Failed to connect to Redis after ${maxAttempts} attempts: ${error.message}`);
        }
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), maxDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }
  },
  inject: [ConfigService],
};
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const DatabaseConfig = MongooseModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const uri = configService.get<string>('MONGO_URI');
    if (!uri) {
      throw new Error('❌ MONGO_URI is not defined in environment variables');
    }

    let attempt = 1;
    const maxDelay = 15000; // Max delay of 30 seconds
    const maxAttempts = configService.get<number>('MONGO_MAX_RETRIES', 0); // 0 means infinite retries

    while (maxAttempts === 0 || attempt <= maxAttempts) {
      try {
        console.log(`✅ Attempt ${attempt}: Connecting to MongoDB Atlas`);
        // Instead of returning here, just break the loop if successful
        break;
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed to connect to MongoDB Atlas: ${error.message}`);
        if (maxAttempts !== 0 && attempt >= maxAttempts) {
          throw new Error(`Failed to connect to MongoDB Atlas after ${maxAttempts} attempts: ${error.message}`);
        }
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), maxDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }
    // Always return a valid object or throw before this point
    return { uri };
  },
});

import Razorpay = require('razorpay');
import { ConfigService } from '@nestjs/config';

export const RazorpayService = {
  provide: 'RAZORPAY_CLIENT',
  useFactory: async (configService: ConfigService) => {
    const keyId = configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = configService.get<string>('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be defined in .env');
    }

    const client = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    return client;
  },
  inject: [ConfigService],
};
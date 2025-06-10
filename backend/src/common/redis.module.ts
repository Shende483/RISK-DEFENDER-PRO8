import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // ✅ Import ConfigModule
import { RedisService } from '../config/redis.config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DoubleClickPreventionInterceptor } from '../common/app-prevention-interceptors';
//import { REDIS_CLIENT } from '../config/redis.config';

@Module({
  imports: [ConfigModule], // ✅ Add ConfigModule to imports
  providers: [RedisService,
    {
      provide: APP_INTERCEPTOR,
      useClass: DoubleClickPreventionInterceptor,
    },


  ],
  exports: [RedisService],
})
export class RedisModule {}



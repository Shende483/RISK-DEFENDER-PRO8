
/*
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { Request,Response } from 'express';

@Injectable()
export class DoubleClickPreventionInterceptor implements NestInterceptor {
  private readonly cooldownPeriod = 15000; // 15 seconds in milliseconds
  private readonly receiveWindow = 5000; // 5 seconds in milliseconds
  private readonly rateLimitWindow = 60000; // 1 minute in milliseconds
  private readonly maxRequestsPerIp = 100; // 1 request per minute per IP
  private readonly redisPrefix = 'double-click:';
  private readonly rateLimitPrefix = 'rate-limit:';
  // New constants for IP banning
  private readonly violationRequestThreshold = 5; // 5 requests to trigger a ban
  private readonly banDurations = [
    300, // 5 minutes
    900, // 15 minutes
    259200, // 3 days (max duration)
  ]; // Ban durations in seconds
  private readonly banPrefix = 'ban:';
  private readonly banViolationsPrefix = 'ban:violations:';

  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const { userId } = request['user'] || {};
    const route = request.path; // e.g., /order-submit/place-new-order
    const ip = request.ip || request.get('X-Forwarded-For')?.split(',')[0] || 'unknown';
    const currentTime = Date.now();

    // New: Check if IP is banned
    const banKey = `${this.banPrefix}${ip}`;
    try {
      const banStartTime = await this.redisClient.get(banKey);
      if (banStartTime) {
        // IP is banned; get remaining TTL
        const ttl = await this.redisClient.ttl(banKey);
        throw new HttpException(
          `IP banned due to repeated rate limit violations. Try again in ${ttl} seconds.`,
          HttpStatus.FORBIDDEN,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error(`Redis error in ban check: ${error.message}`);
      // Fail-open for Redis errors
    }

    // 1. Validate Receive Window
    const timestamp = (request.body as any)?.timestamp;
    if (!timestamp || isNaN(Number(timestamp))) {
      throw new HttpException(
        'Missing or invalid timestamp in request body',
        HttpStatus.BAD_REQUEST,
      );
    }
    const timeDiff = Math.abs(currentTime - Number(timestamp));
    if (timeDiff > this.receiveWindow) {
      throw new HttpException(
        `Request timestamp is outside the ${this.receiveWindow / 1000}-second receive window`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2. IP-Based Rate Limiting
    const rateLimitKey = `${this.rateLimitPrefix}${ip}:${Math.floor(currentTime / this.rateLimitWindow)}`;
    const violationKey = `${this.banViolationsPrefix}${ip}`;
    try {
      const requestCount = await this.redisClient.incr(rateLimitKey);
      if (requestCount === 1) {
        // Set expiration for the first request in the window
        await this.redisClient.expire(rateLimitKey, Math.ceil(this.rateLimitWindow / 1000));
      }
      if (requestCount > this.maxRequestsPerIp) {
        // Rate limit exceeded; increment violation count
        const violationCount = await this.redisClient.incr(violationKey);
        if (violationCount === 1) {
          // Set expiration for violation counter (e.g., 24 hours to reset)
          await this.redisClient.expire(violationKey, 86400);
        }
        // Check if enough requests to trigger a ban (5 requests per violation set)
        const violationSets = Math.floor(violationCount / this.violationRequestThreshold);
        if (violationCount % this.violationRequestThreshold === 0 && violationSets > 0) {
          // Apply ban
          const banDuration = this.banDurations[Math.min(violationSets - 1, this.banDurations.length - 1)];
          await this.redisClient.set(banKey, currentTime, 'EX', banDuration);
          throw new HttpException(
            `IP banned for ${banDuration} seconds due to repeated rate limit violations.`,
            HttpStatus.FORBIDDEN,
          );
        }
        throw new HttpException(
          `Rate limit exceeded: ${this.maxRequestsPerIp} requests per minute per IP`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error(`Redis error in IP rate limiting: ${error.message}`);
      // Fail-open for Redis errors
    }

    // 3. Double-Click Prevention (User-Based)
    if (userId) {
      const doubleClickKey = `${this.redisPrefix}${userId}:${route}`;
      try {
        const lastRequestTime = await this.redisClient.get(doubleClickKey);
        if (lastRequestTime) {
          const timeSinceLastRequest = currentTime - Number(lastRequestTime);
          if (timeSinceLastRequest < this.cooldownPeriod) {
            const remainingTime = Math.ceil((this.cooldownPeriod - timeSinceLastRequest) / 1000);
            throw new HttpException(
              `Please wait ${remainingTime} seconds before submitting another request to this route.`,
              HttpStatus.TOO_MANY_REQUESTS,
            );
          }
        }
        await this.redisClient.set(doubleClickKey, currentTime, 'PX', this.cooldownPeriod);
      } catch (error) {
        if (error instanceof HttpException) {
          throw error;
        }
        console.error(`Redis error in double-click prevention: ${error.message}`);
        // Fail-open for Redis errors
      }
    } else {
      console.warn('No userId found, skipping double-click prevention');
    }

    return next.handle();
  }
}

*/



import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { Request, Response } from 'express';

@Injectable()
export class DoubleClickPreventionInterceptor implements NestInterceptor {
  private readonly cooldownPeriod = 0; // 15 seconds in milliseconds
  private readonly receiveWindow = 5000; // 5 seconds in milliseconds
  private readonly rateLimitWindow = 60000; // 1 minute in milliseconds
  private readonly maxRequestsPerIp = 100; // Max requests per minute per IP
  private readonly redisPrefix = 'double-click:';
  private readonly rateLimitPrefix = 'rate-limit:';
  private readonly violationRequestThreshold = 5; // Requests to trigger a ban
  private readonly banDurations = [
    300, // 5 minutes
    900, // 15 minutes
    259200, // 3 days (max duration)
  ]; // Ban durations in seconds
  private readonly banPrefix = 'ban:';
  private readonly banViolationsPrefix = 'ban:violations:';

  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const { userId } = request['user'] || {};
    const route = request.path; // e.g., /order-submit/place-new-order

    //most imp 
 // Direct IP (request.ip): When your NestJS app is live on a public server (no CDN/proxy), request.ip gives the client’s real public IP (e.g., 203.0.113.1) from the network layer (IP packet header). Use this for rate limiting and banning when requests come from Postman or direct clients.  
 //const ip =request.ip 



 //The X-Client-Ip header is used when the IP is forwarded from a frontend, but this doesn’t apply when requests come from Postman, where request.ip is sufficient.
// Get IP from headers (X-Client-Ip) or fallback to request.ip
//this failed on postman , anyone spoofing the ip using postman then we get
// it get when forwarded user ip from frontend only , but not apply during postman 
    const ip = request.headers['x-client-ip']?.toString() || request.ip || 'unknown';

    // Get timestamp from headers (X-Request-Timestamp) or query params
    const timestamp = request.headers['x-request-timestamp']?.toString() || request.query?.timestamp?.toString() || 'unknown';

   // const ip = request.
    console.log(`Request received from IP: ${ip}, Route: ${route}`);
    const currentTime = Date.now();

    // Check if IP is banned
    const banKey = `${this.banPrefix}${ip}`;
    try {
      const banStartTime = await this.redisClient.get(banKey);
      if (banStartTime) {
        const ttl = await this.redisClient.ttl(banKey);
        console.log(`Ban detected for IP: ${ip}, Ban Key: ${banKey}, Start Time: ${banStartTime}, Remaining TTL: ${ttl} seconds`);
        throw new HttpException(
          `IP banned due to repeated rate limit violations. Try again in ${ttl} seconds.`,
          HttpStatus.FORBIDDEN,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error(`Redis error in ban check for IP ${ip}: ${error.message}`);
      // Fail-open for Redis errors
    }

    // 1. Validate Receive Window
   // const timestamp = (request.body as any)?.timestamp;
    console.log(`Timestamp received: ${timestamp}`);
    if (!timestamp) {
      throw new HttpException('Missing timestamp in request body', HttpStatus.BAD_REQUEST);
    }
    let timestampMs: number;
    if (typeof timestamp === 'string') {
      timestampMs = Date.parse(timestamp); // Parse ISO 8601 string to milliseconds
      if (isNaN(timestampMs)) {
        throw new HttpException('Invalid timestamp format, expected ISO 8601 string', HttpStatus.BAD_REQUEST);
      }
    } else if (typeof timestamp === 'number') {
      timestampMs = timestamp; // Already a number (UNIX timestamp)
    } else {
      throw new HttpException('Invalid timestamp type, expected string or number', HttpStatus.BAD_REQUEST);
    }
    const timeDiff = Math.abs(currentTime - timestampMs);
    if (timeDiff > this.receiveWindow) {
      throw new HttpException(
        `Request timestamp is outside the ${this.receiveWindow / 1000}-second receive window`,
        HttpStatus.BAD_REQUEST,
      );
    }
    
    // 2. IP-Based Rate Limiting
    const rateLimitKey = `${this.rateLimitPrefix}${ip}:${Math.floor(currentTime / this.rateLimitWindow)}`;
    const violationKey = `${this.banViolationsPrefix}${ip}`;
    try {
      const requestCount = await this.redisClient.incr(rateLimitKey);
      if (requestCount === 1) {
        await this.redisClient.expire(rateLimitKey, Math.ceil(this.rateLimitWindow / 1000));
      }
      if (requestCount > this.maxRequestsPerIp) {
        const violationCount = await this.redisClient.incr(violationKey);
        if (violationCount === 1) {
          await this.redisClient.expire(violationKey, 86400);
        }
        const violationSets = Math.floor(violationCount / this.violationRequestThreshold);
        if (violationCount % this.violationRequestThreshold === 0 && violationSets > 0) {
          const banDuration = this.banDurations[Math.min(violationSets - 1, this.banDurations.length - 1)];
          await this.redisClient.set(banKey, currentTime, 'EX', banDuration);
          console.log(`IP banned: IP: ${ip}, Ban Key: ${banKey}, Violation Count: ${violationCount}, Violation Sets: ${violationSets}, Ban Duration: ${banDuration} seconds, Start Time: ${currentTime}`);
          throw new HttpException(
            `IP banned for ${banDuration} seconds due to repeated rate limit violations.`,
            HttpStatus.FORBIDDEN,
          );
        }
        console.log(`Rate limit exceeded for IP: ${ip}, Request Count: ${requestCount}, Violation Count: ${violationCount}`);
        throw new HttpException(
          `Rate limit exceeded: ${this.maxRequestsPerIp} requests per minute per IP`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error(`Redis error in IP rate limiting for IP ${ip}: ${error.message}`);
      // Fail-open for Redis errors
    }

    // 3. Double-Click Prevention (IP-Based)
    const doubleClickKey = `${this.redisPrefix}${ip}:${route}`;
    try {
      const lastRequestTime = await this.redisClient.get(doubleClickKey);
      if (lastRequestTime) {
        const timeSinceLastRequest = currentTime - Number(lastRequestTime);
        if (timeSinceLastRequest < this.cooldownPeriod) {
          const remainingTime = Math.ceil((this.cooldownPeriod - timeSinceLastRequest) / 1000);
          throw new HttpException(
            `Please wait ${remainingTime} seconds before submitting another request to this route.`,
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }
      await this.redisClient.set(doubleClickKey, currentTime, 'PX', this.cooldownPeriod);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error(`Redis error in double-click prevention for IP ${ip}: ${error.message}`);
      // Fail-open for Redis errors
    }

    return next.handle();
  }
}
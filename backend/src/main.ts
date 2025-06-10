import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, BadRequestException, HttpException, Logger } from '@nestjs/common';
import { DoubleClickPreventionInterceptor } from './common/app-prevention-interceptors';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

dotenv.config();

// Create a logger instance
const logger = new Logger('Bootstrap');

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    // Enable CORS for the configured IP
    app.enableCors({
      origin: process.env.FRONTEND_URL,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });

    // Global validation pipe with error handling
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
        exceptionFactory: (errors) => {
          logger.error(`Validation failed: ${JSON.stringify(errors)}`);
          return new BadRequestException('Validation failed');
        },
      }),
    );

    // Register global exception filter
    app.useGlobalFilters(new AllExceptionsFilter());

    // Register the interceptor globally using dependency injection
    // app.useGlobalInterceptors(new DoubleClickPreventionInterceptor());

    // Swagger Configuration
    const config = new DocumentBuilder()
      .setTitle('Trading Terminal API')
      .setDescription('API Documentation for Trading Terminal')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token') // Define Bearer Auth globally
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // Apply Bearer Token Authentication to all API endpoints globally
    document.paths = Object.keys(document.paths).reduce((acc, path) => {
      Object.keys(document.paths[path]).forEach((method) => {
        document.paths[path][method]['security'] = [{ 'access-token': [] }];
      });
      acc[path] = document.paths[path];
      return acc;
    }, {});

    SwaggerModule.setup('api-docs', app, document);




    const PORT = String(process.env.BACKEND_PORT) || '3000';
    const IP_ADDRESS = String(process.env.BACKEND_IP) || '0.0.0.0';

    await app.listen(PORT, IP_ADDRESS);
    console.log(`✅ Server running on http://${IP_ADDRESS}:${PORT}`);
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`, error.stack);
    process.exit(1);
  }
}

// Global uncaught exception handler
process.on('uncaughtException', (error: Error) => {
  logger.error(`Uncaught Exception: ${error.message}`, error.stack);
  // Don't exit the process to keep the server running
});

// Global unhandled rejection handler
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason?.message || reason}`, reason?.stack);
  // Don't exit the process to keep the server running
});

// Global exception filter
class AllExceptionsFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: any) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = 500;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `HTTP ${status} - ${request.method} ${request.url}: ${message}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}

bootstrap();
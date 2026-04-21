import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    // rawBody needed for Stripe webhook signature verification
    rawBody: true,
  });

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Stripe webhook needs raw body — must be registered BEFORE the global json parser
  // NestJS rawBody: true above handles this automatically via RawBodyRequest

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Global API prefix — all routes are served under /api
  // Note: controllers that previously used 'api/foo' have been updated to use just 'foo'
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  logger.log(`Mission Control API running on http://localhost:${port}`);
  logger.log(`kagent API: ${process.env.KAGENT_API_URL ?? 'http://kagent-controller.kagent.svc.cluster.local:8083'}`);
  logger.log(`WebSocket gateway enabled`);
}
bootstrap();

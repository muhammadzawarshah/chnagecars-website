import 'reflect-metadata';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { AppModule } from './app.module';
import { AppConfig } from './config/app-config.service';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{8,100}$/;

/** Correlation id for logs, errors and audit rows. Trusts an upstream X-Request-Id if well-formed. */
function requestId(req: Request & { id?: string }, res: Response, next: NextFunction) {
  const incoming = req.header('x-request-id');
  req.id = incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const config = app.get(AppConfig);
  const prefix = config.get('API_PREFIX');

  app.useLogger(app.get(Logger));
  app.set('trust proxy', config.get('TRUST_PROXY_HOPS'));
  app.disable('x-powered-by');
  app.use(requestId);
  app.use(helmet());
  app.use(compression());
  app.useBodyParser('json', { limit: '1mb' });
  app.enableCors({
    origin: config.get('CORS_ORIGINS'),
    credentials: true,
    exposedHeaders: ['X-Request-Id'],
    maxAge: 600,
  });
  app.setGlobalPrefix(prefix, {
    exclude: [
      { path: 'health/live', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: false,
    }),
  );
  app.enableShutdownHooks();

  if (config.get('SWAGGER_ENABLED')) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('ChangeCars API')
        .setDescription(
          'Automotive marketplace API: vehicle search, listings, dealers, CRM, valuations, dealer bidding, finance tools, content and notifications.\n\n' +
            'Errors always use `{ statusCode, code, message, details?, requestId }`. Lists use `{ data, meta: { page, pageSize, total, pageCount } }`.',
        )
        .setVersion('1.0')
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup('docs', app, document, { jsonDocumentUrl: 'docs/openapi.json' });
  }

  await app.listen(config.get('PORT'), '0.0.0.0');
  app.get(Logger).log(`API listening on :${config.get('PORT')}/${prefix} (docs at /docs)`);
}

void bootstrap();

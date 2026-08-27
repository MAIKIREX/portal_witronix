import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import type { Env } from './config/env.validation';

/**
 * BigInt no tiene representacion en JSON, asi que JSON.stringify lanza
 * "Do not know how to serialize a BigInt" en cuanto una respuesta incluye
 * sizeBytes. Se serializa como string: un archivo puede superar el entero
 * seguro de JavaScript y convertirlo a number perderia precision.
 */
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function (
  this: bigint,
) {
  return this.toString();
};

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  const logger = new Logger('Bootstrap');

  const port = config.get('API_PORT', { infer: true });
  const prefix = config.get('API_PREFIX', { infer: true });
  const corsOrigins = config.get('CORS_ORIGINS', { infer: true });
  const isProduction = config.get('NODE_ENV', { infer: true }) === 'production';

  app.setGlobalPrefix(prefix);

  app.use(
    helmet({
      // El portal sirve imagenes desde MinIO, que esta en otro origen.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: isProduction ? undefined : false,
    }),
  );

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist + forbidNonWhitelisted: cualquier campo no declarado en el
      // DTO se rechaza. Evita que alguien mande "role":"ADMIN" en un update
      // de perfil y escale privilegios por asignacion masiva.
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Portal Witronix - API')
      .setDescription(
        'API del portal privado de gestion de proyectos de iluminacion, domotica e inmotica.',
      )
      .setVersion('0.1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${prefix}/docs`, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port);

  logger.log(`API escuchando en http://localhost:${port}/${prefix}`);
  if (!isProduction) {
    logger.log(`Swagger en http://localhost:${port}/${prefix}/docs`);
  }
}

void bootstrap();

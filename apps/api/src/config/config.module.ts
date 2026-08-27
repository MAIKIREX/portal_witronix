import path from 'node:path';
import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import { validateEnv, type Env } from './env.validation';

/**
 * ConfigService tipado: `config.get('API_PORT')` devuelve number, no string,
 * y un nombre de variable mal escrito lo detecta el compilador.
 */
export type TypedConfigService = ConfigService<Env, true>;

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      // Un unico .env en la raiz del monorepo, compartido con docker-compose
      // y con Prisma, para que no puedan desincronizarse.
      envFilePath: [path.resolve(__dirname, '../../../../.env')],
      validate: validateEnv,
      cache: true,
    }),
  ],
})
export class ConfigModule {}

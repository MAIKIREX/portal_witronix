import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

// El .env vive en la raiz del monorepo, no en apps/api, para que la API,
// docker-compose y las herramientas lean exactamente los mismos valores.
// Prisma no lo encuentra solo, asi que lo cargamos aqui.
loadEnv({ path: path.resolve(__dirname, '../../.env') });

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    seed: 'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
  },
});

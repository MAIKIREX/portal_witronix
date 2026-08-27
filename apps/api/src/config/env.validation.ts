import { z } from 'zod';

/**
 * Validacion del entorno.
 *
 * Se ejecuta al arrancar la aplicacion: si falta una variable o tiene un
 * valor absurdo, el proceso muere en el arranque con un mensaje claro,
 * en vez de fallar tres semanas despues cuando alguien suba un archivo.
 */

const port = () => z.coerce.number().int().min(1).max(65535);
const seconds = () => z.coerce.number().int().positive();

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // ---------- API ----------
  API_PORT: port().default(3001),
  API_PREFIX: z.string().default('api/v1'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  // ---------- Base de datos ----------
  DATABASE_URL: z.string().url(),

  // ---------- JWT ----------
  // Minimo 32 caracteres: un secreto corto hace el JWT trivial de romper
  // por fuerza bruta, y es un fallo que no se nota hasta que es tarde.
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // ---------- Tokens de un solo uso ----------
  INVITATION_EXPIRES_HOURS: z.coerce.number().int().positive().default(72),
  PASSWORD_RESET_EXPIRES_HOURS: z.coerce.number().int().positive().default(2),

  // ---------- Storage (MinIO / compatible S3) ----------
  STORAGE_ENDPOINT: z.string().url(),
  STORAGE_REGION: z.string().default('us-east-1'),
  STORAGE_ACCESS_KEY: z.string().min(1),
  STORAGE_SECRET_KEY: z.string().min(1),
  STORAGE_BUCKET: z.string().min(1),
  // MinIO necesita path-style; S3 y R2 usan virtual-hosted.
  STORAGE_FORCE_PATH_STYLE: z
    .string()
    .default('true')
    .transform((value) => value === 'true'),
  STORAGE_PRESIGN_UPLOAD_TTL: seconds().default(900),
  STORAGE_PRESIGN_DOWNLOAD_TTL: seconds().default(300),
  STORAGE_MAX_FILE_SIZE_MB: z.coerce.number().int().positive().default(500),

  // ---------- Email ----------
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: port().default(1025),
  SMTP_SECURE: z
    .string()
    .default('false')
    .transform((value) => value === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default('Portal Witronix <no-reply@witronixled.com>'),

  // ---------- Frontend ----------
  PORTAL_URL: z.string().url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const detalle = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(raiz)'}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `Configuracion de entorno invalida. Revisa tu archivo .env:\n${detalle}\n`,
    );
  }

  // En produccion los secretos de ejemplo son un fallo de seguridad, no un aviso.
  if (result.data.NODE_ENV === 'production') {
    const inseguros = [
      ['JWT_ACCESS_SECRET', result.data.JWT_ACCESS_SECRET],
      ['JWT_REFRESH_SECRET', result.data.JWT_REFRESH_SECRET],
    ].filter(([, value]) => value.includes('cambiar_este_valor'));

    if (inseguros.length > 0) {
      throw new Error(
        `Secretos de ejemplo detectados en produccion: ${inseguros
          .map(([name]) => name)
          .join(', ')}. Genera valores reales con: openssl rand -base64 48`,
      );
    }
  }

  return result.data;
}

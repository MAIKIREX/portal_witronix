import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Utilidades para tokens de un solo uso (refresh, invitacion, reset).
 *
 * En la base de datos NUNCA se guarda el token en claro, solo su HMAC.
 * Se usa HMAC y no un SHA-256 pelado a proposito: si alguien se lleva un
 * volcado de la base de datos pero no el secreto de la aplicacion, no
 * puede fabricar tokens validos ni comprobar candidatos por fuerza bruta.
 */

/** Token opaco, aleatorio y seguro para URLs. */
export function generateToken(bytes = 48): string {
  return randomBytes(bytes).toString('base64url');
}

export function hashToken(token: string, pepper: string): string {
  return createHmac('sha256', pepper).update(token).digest('hex');
}

/**
 * Comparacion en tiempo constante.
 * Un `===` sobre hashes filtra informacion por el tiempo de respuesta.
 */
export function tokensMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function expiresInHours(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function expiresInDays(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/** Convierte "7d", "15m", "30s" a milisegundos. */
export function parseDuration(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) {
    throw new Error(`Duracion invalida: "${value}". Usa formato 15m, 7d, 30s.`);
  }
  const amount = Number(match[1]);
  const unit = match[2];
  const factors: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return amount * factors[unit];
}

/** Formateo para la interfaz. Locale fijo es-ES. */

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const relativeFormatter = new Intl.RelativeTimeFormat("es-ES", {
  numeric: "auto",
});

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

export function formatDateTime(
  value: string | Date | null | undefined,
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormatter.format(date);
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60 * 1000],
  ["month", 30 * 24 * 60 * 60 * 1000],
  ["day", 24 * 60 * 60 * 1000],
  ["hour", 60 * 60 * 1000],
  ["minute", 60 * 1000],
];

/** "hace 3 dias", "hace 5 minutos". */
export function formatRelative(
  value: string | Date | null | undefined,
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";

  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);

  for (const [unit, ms] of RELATIVE_UNITS) {
    if (abs >= ms) {
      return relativeFormatter.format(Math.round(diff / ms), unit);
    }
  }
  return "ahora mismo";
}

/**
 * Tamano de fichero legible.
 *
 * OJO: el backend sobrescribe BigInt.prototype.toJSON, asi que `sizeBytes`
 * SIEMPRE llega como STRING, nunca como numero. Sumarlo directamente concatena
 * ("1234567" + 1 === "12345671"). Toda conversion pasa por aqui.
 */
export function formatBytes(
  value: string | number | bigint | null | undefined,
): string {
  if (value === null || value === undefined || value === "") return "—";

  const bytes = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(bytes) || bytes < 0) return "—";
  if (bytes === 0) return "0 B";

  const units = ["B", "kB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const size = bytes / Math.pow(1024, exponent);
  // Sin decimales para bytes; uno para el resto.
  const decimals = exponent === 0 ? 0 : size >= 100 ? 0 : 1;

  return `${size.toFixed(decimals).replace(".", ",")} ${units[exponent]}`;
}

/** Iniciales para avatares: "Miguel Angel Tambo" -> "MT". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Pluralizacion simple: formatCount(1, "proyecto") -> "1 proyecto". */
export function formatCount(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

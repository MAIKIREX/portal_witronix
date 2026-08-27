/**
 * Subida de archivos de ejemplo al almacenamiento, para el seed.
 *
 * Sin esto, el seed creaba las filas de renders y documentos pero no sus
 * objetos en MinIO: el portal arrancaba mostrando imagenes rotas y descargas
 * que fallaban, lo que da la impresion de que la aplicacion no funciona.
 *
 * Las imagenes se GENERAN con sharp (que ya es dependencia del backend) en
 * vez de guardarse en el repositorio, para no meter binarios en git.
 *
 * Todo aqui es tolerante a fallos a proposito: si MinIO no esta levantado,
 * el seed avisa y sigue. `pnpm db:seed` tiene que servir tambien cuando solo
 * se quiere la base de datos.
 */
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';

const bucket = process.env.STORAGE_BUCKET ?? 'witronix-portal';

const s3 = new S3Client({
  endpoint: process.env.STORAGE_ENDPOINT ?? 'http://localhost:9000',
  region: process.env.STORAGE_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY ?? 'witronix',
    secretAccessKey: process.env.STORAGE_SECRET_KEY ?? 'witronix_dev_secret',
  },
  // MinIO necesita rutas del tipo /bucket/key en lugar de subdominios.
  forcePathStyle: true,
});

let almacenamientoDisponible: boolean | null = null;

/** Comprueba una sola vez si se puede hablar con el almacenamiento. */
async function hayAlmacenamiento(): Promise<boolean> {
  if (almacenamientoDisponible !== null) return almacenamientoDisponible;
  try {
    // Una consulta a una clave inexistente vale: lo que importa es que el
    // servidor responda algo, aunque sea un 404.
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: '__ping__' }));
    almacenamientoDisponible = true;
  } catch (error) {
    const nombre = (error as { name?: string }).name;
    // NotFound o NoSuchKey significan que MinIO respondio: esta vivo.
    almacenamientoDisponible = nombre === 'NotFound' || nombre === 'NoSuchKey';
  }
  return almacenamientoDisponible;
}

async function existe(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/** Sube el objeto solo si no estaba ya. Devuelve si hizo falta subirlo. */
async function subirSiFalta(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<boolean> {
  if (await existe(key)) return false;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return true;
}

/**
 * Genera un render de ejemplo: un degradado con el titulo encima.
 * No pretende parecer un render real, solo que se vea algo coherente y
 * distinto en cada version.
 */
async function generarRender(
  titulo: string,
  subtitulo: string,
  desde: string,
  hasta: string,
  ancho = 1920,
  alto = 1080,
): Promise<Buffer> {
  const svg = `
    <svg width="${ancho}" height="${alto}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${desde}"/>
          <stop offset="100%" stop-color="${hasta}"/>
        </linearGradient>
      </defs>
      <rect width="${ancho}" height="${alto}" fill="url(#g)"/>
      <text x="96" y="${alto / 2}" font-family="sans-serif" font-size="84"
            font-weight="700" fill="#ffffff">${escapar(titulo)}</text>
      <text x="96" y="${alto / 2 + 76}" font-family="sans-serif" font-size="40"
            fill="#ffffff" opacity="0.75">${escapar(subtitulo)}</text>
      <text x="96" y="${alto - 80}" font-family="sans-serif" font-size="28"
            fill="#ffffff" opacity="0.5">Imagen de ejemplo generada por el seed</text>
    </svg>`;

  return sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toBuffer();
}

/** Miniatura con el mismo criterio que usa el backend al confirmar subidas. */
async function generarMiniatura(original: Buffer): Promise<Buffer> {
  return sharp(original)
    .resize(640, 360, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();
}

/** PDF minimo valido, suficiente para que la descarga funcione de verdad. */
function generarPdf(titulo: string): Buffer {
  const contenido = `BT /F1 24 Tf 72 760 Td (${titulo}) Tj ET
BT /F1 12 Tf 72 720 Td (Documento de ejemplo generado por el seed.) Tj ET`;
  const pdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length ${contenido.length}>>stream
${contenido}
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>
%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export interface ResultadoSubida {
  /** Tamano real del objeto, para guardarlo en la base de datos. */
  sizeBytes: number;
  thumbnailKey: string | null;
  width: number;
  height: number;
}

/** Paleta por version, para que cada una se distinga a simple vista. */
const PALETA = [
  ['#12263f', '#f2b705'],
  ['#0b2a4a', '#e8710a'],
  ['#123', '#ffd166'],
];

export async function sembrarImagenRender(params: {
  storageKey: string;
  titulo: string;
  version: number;
}): Promise<ResultadoSubida | null> {
  if (!(await hayAlmacenamiento())) return null;

  const [desde, hasta] = PALETA[(params.version - 1) % PALETA.length];
  const imagen = await generarRender(
    params.titulo,
    `Version ${params.version}`,
    desde,
    hasta,
  );

  await subirSiFalta(params.storageKey, imagen, 'image/jpeg');

  // El backend nombra las miniaturas thumb_<nombre original>.webp, en la
  // misma carpeta que el original.
  const partes = params.storageKey.split('/');
  const nombre = partes.pop()!;
  const thumbnailKey = [...partes, `thumb_${nombre}.webp`].join('/');

  await subirSiFalta(thumbnailKey, await generarMiniatura(imagen), 'image/webp');

  return {
    sizeBytes: imagen.byteLength,
    thumbnailKey,
    width: 1920,
    height: 1080,
  };
}

export async function sembrarDocumento(params: {
  storageKey: string;
  titulo: string;
}): Promise<{ sizeBytes: number } | null> {
  if (!(await hayAlmacenamiento())) return null;

  const pdf = generarPdf(params.titulo);
  await subirSiFalta(params.storageKey, pdf, 'application/pdf');
  return { sizeBytes: pdf.byteLength };
}

export async function avisarSiNoHayAlmacenamiento(): Promise<void> {
  if (!(await hayAlmacenamiento())) {
    console.warn(
      '\n!! No se pudo contactar con el almacenamiento (MinIO).\n' +
        '   Los datos se crean igual, pero las imagenes y descargas no\n' +
        '   funcionaran. Levanta la infraestructura con: pnpm infra:up\n',
    );
  }
}

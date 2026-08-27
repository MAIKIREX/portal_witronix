import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Env } from '../../config/env.validation';

export interface PresignedUpload {
  uploadUrl: string;
  storageKey: string;
  expiresIn: number;
}

export interface ObjectMetadata {
  sizeBytes: number;
  mimeType: string;
  etag?: string;
}

/**
 * Acceso al almacenamiento de objetos.
 *
 * Habla el protocolo S3, asi que el mismo codigo sirve para MinIO en local,
 * MinIO en la VPS, Cloudflare R2 o Amazon S3: solo cambian las variables de
 * entorno. Por eso los modulos de negocio dependen de este servicio y nunca
 * del SDK directamente.
 *
 * Los binarios NUNCA pasan por la API. Este servicio firma URLs y el
 * navegador sube y descarga directo contra el almacenamiento; un render de
 * 40 MB atravesando Node seria el primer cuello de botella del portal.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly uploadTtl: number;
  private readonly downloadTtl: number;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.bucket = this.config.get('STORAGE_BUCKET', { infer: true });
    this.uploadTtl = this.config.get('STORAGE_PRESIGN_UPLOAD_TTL', { infer: true });
    this.downloadTtl = this.config.get('STORAGE_PRESIGN_DOWNLOAD_TTL', { infer: true });

    this.client = new S3Client({
      endpoint: this.config.get('STORAGE_ENDPOINT', { infer: true }),
      region: this.config.get('STORAGE_REGION', { infer: true }),
      credentials: {
        accessKeyId: this.config.get('STORAGE_ACCESS_KEY', { infer: true }),
        secretAccessKey: this.config.get('STORAGE_SECRET_KEY', { infer: true }),
      },
      // MinIO sirve los buckets como ruta (/bucket/key); S3 y R2 usan
      // subdominio. Sin esto, MinIO devuelve 404 en todo.
      forcePathStyle: this.config.get('STORAGE_FORCE_PATH_STYLE', { infer: true }),
    });
  }

  async onModuleInit(): Promise<void> {
    const ok = await this.isHealthy();
    if (ok) {
      this.logger.log(`Conectado al bucket "${this.bucket}"`);
    } else {
      this.logger.warn(
        `No se pudo acceder al bucket "${this.bucket}". ` +
          'Comprueba que MinIO este levantado: pnpm infra:up',
      );
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Construye la clave de almacenamiento de una version.
   * Incluye el numero de version en la ruta para que las versiones
   * antiguas nunca puedan ser pisadas por una nueva.
   */
  buildVersionKey(params: {
    projectId: string;
    kind: 'files' | 'renders';
    containerId: string;
    version: number;
    filename: string;
  }): string {
    const safe = this.sanitizeFilename(params.filename);
    return `projects/${params.projectId}/${params.kind}/${params.containerId}/v${params.version}/${safe}`;
  }

  buildThumbnailKey(storageKey: string): string {
    return storageKey.replace(/\/([^/]+)$/, '/thumb_$1.webp');
  }

  /** URL temporal para que el cliente suba el archivo directo al storage. */
  async createUploadUrl(
    storageKey: string,
    mimeType: string,
  ): Promise<PresignedUpload> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: this.uploadTtl,
    });

    return { uploadUrl, storageKey, expiresIn: this.uploadTtl };
  }

  /**
   * URL temporal de descarga. Vida corta a proposito: si alguien reenvia
   * el enlace por WhatsApp, caduca antes de convertirse en una fuga.
   */
  async createDownloadUrl(
    storageKey: string,
    downloadFilename?: string,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      ...(downloadFilename
        ? {
            ResponseContentDisposition: `attachment; filename="${this.sanitizeFilename(
              downloadFilename,
            )}"`,
          }
        : {}),
    });

    return getSignedUrl(this.client, command, { expiresIn: this.downloadTtl });
  }

  /**
   * Lee los metadatos reales del objeto ya subido.
   * Se usa al confirmar una subida: el tamano y el tipo que declara el
   * cliente son una sugerencia, no un hecho.
   */
  async getObjectMetadata(storageKey: string): Promise<ObjectMetadata | null> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: storageKey }),
      );
      return {
        sizeBytes: result.ContentLength ?? 0,
        mimeType: result.ContentType ?? 'application/octet-stream',
        etag: result.ETag,
      };
    } catch {
      return null;
    }
  }

  async objectExists(storageKey: string): Promise<boolean> {
    return (await this.getObjectMetadata(storageKey)) !== null;
  }

  /**
   * Descarga el objeto a memoria. Uso restringido: solo para generar
   * miniaturas en segundo plano. Los archivos que pide el usuario NUNCA
   * se sirven por aqui, se firman URLs.
   */
  async getObjectBuffer(storageKey: string): Promise<Buffer | null> {
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }),
      );
      if (!result.Body) return null;
      return Buffer.from(await result.Body.transformToByteArray());
    } catch (error) {
      this.logger.warn(
        `No se pudo leer el objeto ${storageKey}: ` +
          (error instanceof Error ? error.message : String(error)),
      );
      return null;
    }
  }

  /**
   * Solo para limpiar subidas abandonadas o miniaturas huerfanas.
   * Las versiones publicadas NUNCA se borran: la trazabilidad de
   * aprobaciones depende de que el objeto siga existiendo.
   */
  async deleteObject(storageKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }),
    );
  }

  /** Sube un buffer desde el servidor (miniaturas, no archivos de usuario). */
  async putObject(
    storageKey: string,
    body: Buffer,
    mimeType: string,
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: body,
        ContentType: mimeType,
      }),
    );
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // quitar acentos
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .slice(0, 200);
  }
}

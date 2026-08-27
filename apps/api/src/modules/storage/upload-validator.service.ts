import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ALLOWED_MIME_TYPES, TECHNICAL_EXTENSIONS } from '@witronix/shared';
import type { Env } from '../../config/env.validation';

/**
 * Valida lo que el cliente declara ANTES de firmar la URL de subida.
 *
 * Es una primera barrera, no la ultima: el tamano y el tipo que manda el
 * navegador son una promesa, no un hecho. Al confirmar la subida se leen
 * los metadatos reales del objeto ya almacenado y se vuelve a comprobar.
 */
@Injectable()
export class UploadValidatorService {
  private readonly maxBytes: number;

  constructor(config: ConfigService<Env, true>) {
    this.maxBytes =
      config.get('STORAGE_MAX_FILE_SIZE_MB', { infer: true }) * 1024 * 1024;
  }

  get maxSizeBytes(): number {
    return this.maxBytes;
  }

  validate(params: {
    filename: string;
    mimeType: string;
    sizeBytes: number;
  }): void {
    this.validateSize(params.sizeBytes);
    this.validateMime(params.filename, params.mimeType);
  }

  validateSize(sizeBytes: number): void {
    if (sizeBytes > this.maxBytes) {
      const mb = Math.round(this.maxBytes / 1024 / 1024);
      const intento = Math.round(sizeBytes / 1024 / 1024);
      throw new BadRequestException(
        `El archivo pesa ${intento} MB y el limite es ${mb} MB`,
      );
    }
  }

  validateMime(filename: string, mimeType: string): void {
    if (ALLOWED_MIME_TYPES.includes(mimeType)) {
      // Los formatos del sector (IES, LDT, DWG, IFC...) llegan casi siempre
      // como application/octet-stream, asi que ese tipo generico solo se
      // acepta si la extension corresponde a uno de ellos. Si no, seria un
      // agujero por el que colar cualquier cosa.
      if (mimeType === 'application/octet-stream') {
        this.validateTechnicalExtension(filename);
      }
      return;
    }

    throw new BadRequestException(
      `Tipo de archivo no permitido: ${mimeType}`,
    );
  }

  private validateTechnicalExtension(filename: string): void {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    if (!TECHNICAL_EXTENSIONS.includes(ext as (typeof TECHNICAL_EXTENSIONS)[number])) {
      throw new BadRequestException(
        `Extension no reconocida para un archivo generico: .${ext}. ` +
          `Permitidas: ${TECHNICAL_EXTENSIONS.join(', ')}`,
      );
    }
  }

  isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UploadStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from './storage.service';

/**
 * Purga las subidas abandonadas.
 *
 * Una version se crea en PENDING antes de que el navegador suba el objeto.
 * Si el usuario cierra la pestana a medias, esa fila apunta a un objeto que
 * no existe. Sin esta limpieza el historial se llena de versiones fantasma
 * que rompen la numeracion y confunden el listado.
 */
@Injectable()
export class UploadCleanupService {
  private readonly logger = new Logger(UploadCleanupService.name);

  /** Margen amplio: la URL firmada dura 15 min y una subida grande tarda. */
  private static readonly STALE_AFTER_MS = 2 * 60 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async purgeStaleUploads(): Promise<void> {
    const cutoff = new Date(Date.now() - UploadCleanupService.STALE_AFTER_MS);

    const [fileVersions, renderVersions] = await Promise.all([
      this.prisma.fileVersion.findMany({
        where: {
          uploadStatus: { in: [UploadStatus.PENDING, UploadStatus.FAILED] },
          createdAt: { lt: cutoff },
        },
        select: { id: true, storageKey: true },
      }),
      this.prisma.renderVersion.findMany({
        where: {
          uploadStatus: { in: [UploadStatus.PENDING, UploadStatus.FAILED] },
          createdAt: { lt: cutoff },
        },
        select: { id: true, storageKey: true },
      }),
    ]);

    const total = fileVersions.length + renderVersions.length;
    if (total === 0) return;

    // Si el objeto llego a subirse pero nunca se confirmo, tambien se borra:
    // sin fila que lo referencie seria espacio ocupado para siempre.
    for (const v of [...fileVersions, ...renderVersions]) {
      await this.storage.deleteObject(v.storageKey).catch(() => undefined);
    }

    await this.prisma.$transaction([
      this.prisma.fileVersion.deleteMany({
        where: { id: { in: fileVersions.map((v) => v.id) } },
      }),
      this.prisma.renderVersion.deleteMany({
        where: { id: { in: renderVersions.map((v) => v.id) } },
      }),
    ]);

    this.logger.log(`Subidas abandonadas purgadas: ${total}`);
  }

  /** Elimina refresh tokens y tokens de un solo uso ya caducados. */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeExpiredTokens(): Promise<void> {
    const now = new Date();

    const [refresh, resets, invites] = await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: now } } }),
      this.prisma.passwordResetToken.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
      this.prisma.invitation.deleteMany({
        where: { expiresAt: { lt: now }, acceptedAt: null },
      }),
    ]);

    const total = refresh.count + resets.count + invites.count;
    if (total > 0) {
      this.logger.log(
        `Tokens caducados purgados: ${refresh.count} sesiones, ` +
          `${resets.count} resets, ${invites.count} invitaciones`,
      );
    }
  }
}

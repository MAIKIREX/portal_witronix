import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { ActivityModule } from './modules/activity/activity.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { ClientsModule } from './modules/clients/clients.module';
import { CommentsModule } from './modules/comments/comments.module';
import { FilesModule } from './modules/files/files.module';
import { HealthModule } from './modules/health/health.module';
import { MailModule } from './modules/mail/mail.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { RendersModule } from './modules/renders/renders.module';
import { StorageModule } from './modules/storage/storage.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ProjectAccessGuard } from './common/guards/project-access.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    // ConfigModule primero: valida el entorno antes de que nada mas arranque.
    ConfigModule,
    PrismaModule,
    CommonModule,
    StorageModule,
    MailModule,
    // Eventos de dominio: desacoplan el negocio de las notificaciones.
    EventEmitterModule.forRoot({ global: true }),
    // Tareas programadas: purga de subidas abandonadas y tokens caducados.
    ScheduleModule.forRoot(),
    // Limite global generoso; las rutas sensibles lo aprietan con @Throttle.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    AuthModule,
    ClientsModule,
    ProjectsModule,
    FilesModule,
    RendersModule,
    CommentsModule,
    ApprovalsModule,
    NotificationsModule,
    ActivityModule,
    HealthModule,
  ],
  providers: [
    // El orden importa: primero se limita el trafico, luego se autentica,
    // y solo despues se comprueban rol y pertenencia al proyecto.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ProjectAccessGuard },
  ],
})
export class AppModule {}

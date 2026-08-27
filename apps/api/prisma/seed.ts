/**
 * Datos de ejemplo para desarrollo local.
 *
 * Crea un escenario completo con el que se puede recorrer el ciclo del
 * portal por Swagger sin inventar nada: usuarios de los 4 roles, dos
 * clientes distintos (para probar el aislamiento entre ellos), proyectos
 * en varios estados, y un render con historial de versiones y aprobacion.
 *
 * Ejecutar con:  pnpm db:seed
 * Es idempotente: se puede repetir sin duplicar datos.
 */
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import * as argon2 from 'argon2';
import {
  ApprovalStatus,
  FileCategory,
  PrismaClient,
  ProjectRole,
  ProjectStatus,
  RenderType,
  Role,
  TargetType,
  UploadStatus,
} from '@prisma/client';
import {
  avisarSiNoHayAlmacenamiento,
  sembrarDocumento,
  sembrarImagenRender,
} from './seed-storage';

loadEnv({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

// Contrasena unica para todas las cuentas de ejemplo.
// Solo existe en local; el .env de produccion nunca corre este seed.
const DEMO_PASSWORD = 'Witronix2026!';

async function main(): Promise<void> {
  console.log('Sembrando datos de ejemplo...\n');

  const passwordHash = await argon2.hash(DEMO_PASSWORD);

  // ---------------- Equipo interno ----------------
  const admin = await prisma.user.upsert({
    where: { email: 'admin@witronixled.com' },
    update: {},
    create: {
      email: 'admin@witronixled.com',
      name: 'Miguel Administrador',
      role: Role.ADMIN,
      passwordHash,
    },
  });

  const pm = await prisma.user.upsert({
    where: { email: 'pm@witronixled.com' },
    update: {},
    create: {
      email: 'pm@witronixled.com',
      name: 'Ana Project Manager',
      role: Role.PROJECT_MANAGER,
      passwordHash,
    },
  });

  const tecnico = await prisma.user.upsert({
    where: { email: 'tecnico@witronixled.com' },
    update: {},
    create: {
      email: 'tecnico@witronixled.com',
      name: 'Carlos Tecnico',
      role: Role.TECHNICIAN,
      passwordHash,
    },
  });

  console.log('Equipo interno: admin, pm, tecnico');

  // ---------------- Clientes ----------------
  // Dos clientes distintos a proposito: permiten verificar que el cliente
  // de uno recibe 403 al pedir los proyectos del otro.
  const constructora = await prisma.client.upsert({
    where: { id: '11111111-1111-4111-8111-111111111111' },
    update: {},
    create: {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Constructora XYZ',
      taxId: '1023456789',
      contactEmail: 'contacto@constructoraxyz.bo',
      phone: '+591 70000001',
      address: 'Av. Ballivian 123, La Paz',
    },
  });

  const hotelera = await prisma.client.upsert({
    where: { id: '22222222-2222-4222-8222-222222222222' },
    update: {},
    create: {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Grupo Hotelero Central',
      taxId: '1098765432',
      contactEmail: 'proyectos@hotelcentral.bo',
      phone: '+591 70000002',
      address: 'Calle Comercio 456, Santa Cruz',
    },
  });

  const clienteXyz = await prisma.user.upsert({
    where: { email: 'cliente@constructoraxyz.bo' },
    update: {},
    create: {
      email: 'cliente@constructoraxyz.bo',
      name: 'Juan Perez',
      role: Role.CLIENT,
      clientId: constructora.id,
      passwordHash,
    },
  });

  const clienteHotel = await prisma.user.upsert({
    where: { email: 'cliente@hotelcentral.bo' },
    update: {},
    create: {
      email: 'cliente@hotelcentral.bo',
      name: 'Laura Gutierrez',
      role: Role.CLIENT,
      clientId: hotelera.id,
      passwordHash,
    },
  });

  console.log('Clientes: Constructora XYZ, Grupo Hotelero Central');

  // ---------------- Proyectos ----------------
  const proyectos = [
    {
      id: '33333333-3333-4333-8333-333333333331',
      clientId: constructora.id,
      code: 'PRY-2026-001',
      name: 'Edificio Mirador',
      description: 'Iluminacion arquitectonica de lobby, pasillos y fachada.',
      location: 'La Paz, Bolivia',
      status: ProjectStatus.EN_DISENO,
      progress: 45,
    },
    {
      id: '33333333-3333-4333-8333-333333333332',
      clientId: constructora.id,
      code: 'PRY-2026-002',
      name: 'Oficinas Central',
      description: 'Iluminacion de oficinas con control DALI y sensores.',
      location: 'La Paz, Bolivia',
      status: ProjectStatus.ESPERANDO_CLIENTE,
      progress: 70,
    },
    {
      id: '33333333-3333-4333-8333-333333333333',
      clientId: hotelera.id,
      code: 'PRY-2026-003',
      name: 'Hotel Central - Remodelacion',
      description: 'Domotica de habitaciones e iluminacion de areas comunes.',
      location: 'Santa Cruz, Bolivia',
      status: ProjectStatus.EN_INSTALACION,
      progress: 85,
    },
  ];

  for (const p of proyectos) {
    await prisma.project.upsert({
      where: { id: p.id },
      update: {},
      create: { ...p, createdById: pm.id, startDate: new Date('2026-01-15') },
    });
  }

  console.log('Proyectos: 3 en estados distintos');

  // ---------------- Miembros ----------------
  const membresias = [
    { projectId: proyectos[0].id, userId: pm.id, projectRole: ProjectRole.MANAGER },
    { projectId: proyectos[0].id, userId: tecnico.id, projectRole: ProjectRole.COLLABORATOR },
    { projectId: proyectos[0].id, userId: clienteXyz.id, projectRole: ProjectRole.VIEWER },
    { projectId: proyectos[1].id, userId: pm.id, projectRole: ProjectRole.MANAGER },
    { projectId: proyectos[1].id, userId: clienteXyz.id, projectRole: ProjectRole.VIEWER },
    // El cliente del hotel SOLO esta en el proyecto 3: es la comprobacion
    // negativa de aislamiento entre clientes.
    { projectId: proyectos[2].id, userId: pm.id, projectRole: ProjectRole.MANAGER },
    { projectId: proyectos[2].id, userId: tecnico.id, projectRole: ProjectRole.COLLABORATOR },
    { projectId: proyectos[2].id, userId: clienteHotel.id, projectRole: ProjectRole.VIEWER },
  ];

  for (const m of membresias) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: m.projectId, userId: m.userId } },
      update: {},
      create: { ...m, addedById: admin.id },
    });
  }

  console.log('Miembros asignados');

  // ---------------- Render con historial de versiones ----------------
  const renderId = '44444444-4444-4444-8444-444444444444';

  await prisma.render.upsert({
    where: { id: renderId },
    update: {},
    create: {
      id: renderId,
      projectId: proyectos[0].id,
      title: 'Lobby principal',
      area: 'Recepcion',
      type: RenderType.INTERIOR,
      description: 'Propuesta de iluminacion del lobby de acceso.',
      createdById: tecnico.id,
    },
  });

  // V1 propuesta inicial, V2 tras cambios, V3 la aprobada.
  // Las tres siguen existiendo: nunca se sobrescribe una version.
  const versiones = [
    { v: 1, notes: 'Propuesta inicial - 4000K', status: ApprovalStatus.CAMBIOS_SOLICITADOS },
    { v: 2, notes: 'Cambios solicitados: temperatura mas calida - 3000K', status: ApprovalStatus.CAMBIOS_SOLICITADOS },
    { v: 3, notes: 'Ajuste de luminaria en recepcion', status: ApprovalStatus.APROBADO },
  ];

  let ultimaVersionId = '';
  for (const item of versiones) {
    const id = `55555555-5555-4555-8555-55555555555${item.v}`;
    const storageKey = `projects/${proyectos[0].id}/renders/${renderId}/v${item.v}/lobby.jpg`;

    // Se genera y sube la imagen ANTES de escribir la fila, para poder
    // guardar el tamano real del objeto en lugar de uno inventado.
    const subida = await sembrarImagenRender({
      storageKey,
      titulo: 'Lobby principal',
      version: item.v,
    });

    await prisma.renderVersion.upsert({
      where: { id },
      update: {},
      create: {
        id,
        renderId,
        version: item.v,
        storageKey,
        originalName: `lobby_v${item.v}.jpg`,
        mimeType: 'image/jpeg',
        sizeBytes: BigInt(subida?.sizeBytes ?? 2_400_000),
        thumbnailKey: subida?.thumbnailKey ?? null,
        width: 1920,
        height: 1080,
        status: item.status,
        notes: item.notes,
        uploadedById: tecnico.id,
        uploadStatus: UploadStatus.COMPLETED,
      },
    });
    ultimaVersionId = id;
  }

  await prisma.render.update({
    where: { id: renderId },
    data: { currentVersionId: ultimaVersionId },
  });

  console.log('Render "Lobby principal" con 3 versiones (V3 aprobada)');

  // ---------------- Comentario anclado sobre el render ----------------
  // Reproduce el ejemplo de la seccion 8: comentario sobre una zona concreta.
  const comentarioId = '66666666-6666-4666-8666-666666666666';
  await prisma.comment.upsert({
    where: { id: comentarioId },
    update: {},
    create: {
      id: comentarioId,
      projectId: proyectos[0].id,
      authorId: clienteXyz.id,
      body: 'Podemos cambiar esta luminaria por una opcion con temperatura de color mas calida?',
      targetType: TargetType.RENDER_VERSION,
      targetId: '55555555-5555-4555-8555-555555555551',
      // Coordenadas relativas: 62% del ancho, 38% del alto.
      anchorX: 0.62,
      anchorY: 0.38,
    },
  });

  await prisma.comment.upsert({
    where: { id: '66666666-6666-4666-8666-666666666667' },
    update: {},
    create: {
      id: '66666666-6666-4666-8666-666666666667',
      projectId: proyectos[0].id,
      authorId: tecnico.id,
      body: 'Ajustado a 3000K en la version 2. Quedamos atentos a tu revision.',
      parentId: comentarioId,
      targetType: TargetType.RENDER_VERSION,
      targetId: '55555555-5555-4555-8555-555555555551',
    },
  });

  console.log('Comentario anclado + respuesta en hilo');

  // ---------------- Aprobacion con historial ----------------
  const aprobacionId = '77777777-7777-4777-8777-777777777777';
  await prisma.approval.upsert({
    where: { id: aprobacionId },
    update: {},
    create: {
      id: aprobacionId,
      projectId: proyectos[0].id,
      targetType: TargetType.RENDER_VERSION,
      targetId: ultimaVersionId,
      status: ApprovalStatus.APROBADO,
      requestedById: pm.id,
      decidedById: clienteXyz.id,
      decidedAt: new Date(),
      comment: 'Aprobado. Procedan con la compra.',
    },
  });

  const eventos = [
    { from: null, to: ApprovalStatus.PENDIENTE, actor: pm.id, comment: 'Solicitada aprobacion de V3' },
    { from: ApprovalStatus.PENDIENTE, to: ApprovalStatus.EN_REVISION, actor: clienteXyz.id, comment: null },
    { from: ApprovalStatus.EN_REVISION, to: ApprovalStatus.APROBADO, actor: clienteXyz.id, comment: 'Aprobado. Procedan con la compra.' },
  ];

  for (const [i, e] of eventos.entries()) {
    await prisma.approvalEvent.upsert({
      where: { id: `88888888-8888-4888-8888-88888888888${i}` },
      update: {},
      create: {
        id: `88888888-8888-4888-8888-88888888888${i}`,
        approvalId: aprobacionId,
        fromStatus: e.from,
        toStatus: e.to,
        actorId: e.actor,
        comment: e.comment,
      },
    });
  }

  console.log('Aprobacion de V3 con historial completo de 3 eventos');

  // ---------------- Documentos ----------------
  const documentos = [
    { id: '99999999-9999-4999-8999-999999999991', name: 'Plano de iluminacion - Planta baja', category: FileCategory.PLANO },
    { id: '99999999-9999-4999-8999-999999999992', name: 'Ficha tecnica DL-20', category: FileCategory.FICHA_TECNICA },
    { id: '99999999-9999-4999-8999-999999999993', name: 'Certificacion CE - Linea LX', category: FileCategory.CERTIFICACION },
  ];

  for (const [indice, doc] of documentos.entries()) {
    await prisma.projectFile.upsert({
      where: { id: doc.id },
      update: {},
      create: {
        id: doc.id,
        projectId: proyectos[0].id,
        category: doc.category,
        name: doc.name,
        createdById: tecnico.id,
      },
    });

    // Cada documento necesita al menos una version con su PDF: sin ella el
    // portal lo muestra como "sin archivo" y no se puede descargar.
    const versionId = `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa${indice + 1}`;
    const nombreArchivo = `${doc.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}.pdf`;
    const storageKey = `projects/${proyectos[0].id}/files/${doc.id}/v1/${nombreArchivo}`;

    const subida = await sembrarDocumento({ storageKey, titulo: doc.name });

    await prisma.fileVersion.upsert({
      where: { id: versionId },
      update: {},
      create: {
        id: versionId,
        fileId: doc.id,
        version: 1,
        storageKey,
        originalName: nombreArchivo,
        mimeType: 'application/pdf',
        sizeBytes: BigInt(subida?.sizeBytes ?? 120_000),
        uploadedById: tecnico.id,
        uploadStatus: UploadStatus.COMPLETED,
      },
    });

    await prisma.projectFile.update({
      where: { id: doc.id },
      data: { currentVersionId: versionId },
    });
  }

  console.log('3 documentos de ejemplo, cada uno con su PDF');

  await avisarSiNoHayAlmacenamiento();
  console.log('');

  // ---------------- Resumen ----------------
  console.log('='.repeat(58));
  console.log('  Datos listos. Contrasena para todas las cuentas:');
  console.log(`  ${DEMO_PASSWORD}`);
  console.log('='.repeat(58));
  console.log('  admin@witronixled.com        ADMIN');
  console.log('  pm@witronixled.com           PROJECT_MANAGER');
  console.log('  tecnico@witronixled.com      TECHNICIAN');
  console.log('  cliente@constructoraxyz.bo   CLIENT  -> proyectos 001 y 002');
  console.log('  cliente@hotelcentral.bo      CLIENT  -> solo proyecto 003');
  console.log('='.repeat(58));
}

main()
  .catch((error) => {
    console.error('Error al sembrar datos:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });

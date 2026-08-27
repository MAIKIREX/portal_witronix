import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { Env } from '../../config/env.validation';

interface SendOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envio de correo. En local apunta a Mailpit (http://localhost:8025),
 * que captura todo sin enviar nada a direcciones reales: se puede probar
 * el flujo de invitaciones sin bombardear buzones de verdad.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly portalUrl: string;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.from = this.config.get('SMTP_FROM', { infer: true });
    this.portalUrl = this.config.get('PORTAL_URL', { infer: true });

    const user = this.config.get('SMTP_USER', { infer: true });
    const pass = this.config.get('SMTP_PASSWORD', { infer: true });

    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST', { infer: true }),
      port: this.config.get('SMTP_PORT', { infer: true }),
      secure: this.config.get('SMTP_SECURE', { infer: true }),
      // Mailpit no pide credenciales; solo se envian si estan configuradas.
      ...(user ? { auth: { user, pass } } : {}),
    });
  }

  async send(options: SendOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text ?? this.htmlToText(options.html),
      });
      this.logger.log(`Email enviado a ${options.to}: ${options.subject}`);
    } catch (error) {
      // Un fallo de correo no debe tumbar la operacion de negocio: la
      // invitacion ya esta creada y el admin puede reenviarla.
      this.logger.error(
        `No se pudo enviar el email a ${options.to}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async sendInvitation(params: {
    to: string;
    inviterName: string;
    token: string;
    expiresAt: Date;
  }): Promise<void> {
    const link = `${this.portalUrl}/invitacion/${params.token}`;
    const caduca = params.expiresAt.toLocaleDateString('es-BO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    await this.send({
      to: params.to,
      subject: 'Invitacion al Portal Witronix',
      html: this.layout(`
        <h1>Te han invitado al Portal Witronix</h1>
        <p><strong>${this.escape(params.inviterName)}</strong> te ha invitado a acceder
        al portal de gestion de proyectos de Witronix.</p>
        <p>Desde ahi podras consultar el avance de tus proyectos, revisar
        renders y planos, comentar y aprobar propuestas.</p>
        ${this.button(link, 'Crear mi contrasena')}
        <p class="muted">Esta invitacion caduca el ${caduca}.
        Si no esperabas este correo, puedes ignorarlo.</p>
      `),
    });
  }

  async sendPasswordReset(params: {
    to: string;
    name: string;
    token: string;
  }): Promise<void> {
    const link = `${this.portalUrl}/recuperar/${params.token}`;

    await this.send({
      to: params.to,
      subject: 'Restablecer tu contrasena - Portal Witronix',
      html: this.layout(`
        <h1>Restablecer contrasena</h1>
        <p>Hola ${this.escape(params.name)}, recibimos una solicitud para
        restablecer la contrasena de tu cuenta.</p>
        ${this.button(link, 'Elegir nueva contrasena')}
        <p class="muted">El enlace caduca en 2 horas. Si no fuiste tu,
        ignora este correo: tu contrasena actual sigue siendo valida.</p>
      `),
    });
  }

  async sendNotification(params: {
    to: string;
    name: string;
    title: string;
    body: string;
    link?: string;
  }): Promise<void> {
    await this.send({
      to: params.to,
      subject: params.title,
      html: this.layout(`
        <h1>${this.escape(params.title)}</h1>
        <p>Hola ${this.escape(params.name)},</p>
        <p>${this.escape(params.body)}</p>
        ${params.link ? this.button(`${this.portalUrl}${params.link}`, 'Ver en el portal') : ''}
      `),
    });
  }

  private layout(content: string): string {
    return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:24px;background:#0f172a;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#e2e8f0}
  .card{max-width:560px;margin:0 auto;background:#1e293b;border-radius:16px;padding:32px;border:1px solid #334155}
  h1{font-size:20px;margin:0 0 16px;color:#fff}
  p{line-height:1.6;margin:0 0 16px;color:#cbd5e1}
  .muted{font-size:13px;color:#94a3b8}
  .btn{display:inline-block;background:#49BFE5;color:#0f172a!important;text-decoration:none;
       padding:12px 24px;border-radius:999px;font-weight:700;margin:8px 0 20px}
  .footer{text-align:center;font-size:12px;color:#64748b;margin-top:24px}
</style></head>
<body><div class="card">${content}
<div class="footer">Witronix &mdash; Iluminacion, domotica e inmotica</div>
</div></body></html>`;
  }

  private button(href: string, label: string): string {
    return `<p><a class="btn" href="${href}">${label}</a></p>
      <p class="muted">Si el boton no funciona, copia este enlace:<br>
      <span style="word-break:break-all">${href}</span></p>`;
  }

  /** Escapa el contenido dinamico: los nombres vienen de la base de datos. */
  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
}

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

/**
 * Traduce cualquier excepcion a una respuesta JSON uniforme.
 *
 * Los errores de Prisma se mapean a codigos HTTP con mensajes en espanol:
 * sin esto, un email duplicado devuelve un 500 con el stack de Prisma,
 * que ademas filtra nombres de tablas y columnas al cliente.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, error } = this.resolve(exception);

    const body: ErrorBody = {
      statusCode: status,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(body);
  }

  private resolve(exception: unknown): {
    status: number;
    message: string | string[];
    error: string;
  } {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : ((res as Record<string, unknown>).message as string | string[]) ??
            exception.message;

      return {
        status: exception.getStatus(),
        message,
        error: exception.name,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.resolvePrisma(exception);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Los datos enviados no son validos',
        error: 'ValidationError',
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error interno del servidor',
      error: 'InternalServerError',
    };
  }

  private resolvePrisma(exception: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
    error: string;
  } {
    switch (exception.code) {
      case 'P2002': {
        const target = exception.meta?.target;
        const campos = Array.isArray(target) ? target.join(', ') : 'el registro';
        return {
          status: HttpStatus.CONFLICT,
          message: `Ya existe un registro con ese valor en: ${campos}`,
          error: 'Conflict',
        };
      }
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Referencia invalida: el registro relacionado no existe',
          error: 'BadRequest',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'El registro solicitado no existe',
          error: 'NotFound',
        };
      case 'P2014':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'La operacion romperia una relacion existente',
          error: 'BadRequest',
        };
      default:
        this.logger.error(`Error de Prisma no mapeado: ${exception.code}`);
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error al acceder a la base de datos',
          error: 'DatabaseError',
        };
    }
  }
}

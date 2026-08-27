import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ClientsService } from './clients.service';
import {
  ClientQueryDto,
  CreateClientDto,
  UpdateClientDto,
} from './dto/client.dto';
import { Roles } from '../../common/decorators';

/**
 * Gestion de empresas cliente. Solo equipo interno: un usuario con rol
 * CLIENT no tiene por que saber que otros clientes existen.
 */
@ApiTags('clients')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN, Role.PROJECT_MANAGER)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar clientes' })
  findAll(@Query() query: ClientQueryDto) {
    return this.clients.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un cliente con sus usuarios y proyectos' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clients.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear cliente' })
  create(@Body() dto: CreateClientDto) {
    return this.clients.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cliente' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clients.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Desactivar cliente',
    description:
      'No borra nada: marca el cliente como inactivo para conservar el historial de sus proyectos.',
  })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.clients.deactivate(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { UserJwtPayload } from '../auth/typs/user-jwt-payload.type';
import { Role, Status } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // 🔹 Listar tickets
  @Roles(Role.ADMIN, Role.AGENT, Role.CUSTOMER)
  @Get()
  findAll(@CurrentUser() user: UserJwtPayload) {
    return this.ticketsService.findAll(user);
  }

  // 🔹 Crear ticket
  @Roles(Role.CUSTOMER)
  @Post()
  create(
    @CurrentUser() user: UserJwtPayload,
    @Body() body: { title: string; description: string; priority: string },
  ) {
    return this.ticketsService.create(user, body);
  }

  // 🔹 Actualizar estado
  @Roles(Role.ADMIN, Role.AGENT)
  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: UserJwtPayload,
    @Param('id') id: string,
    @Body() body: { status: Status },
  ) {
    return this.ticketsService.updateStatus(user, id, body.status);
  }

  // 🔹 Eliminar ticket
  @Roles(Role.ADMIN)
  @Delete(':id')
  delete(@CurrentUser() user: UserJwtPayload, @Param('id') id: string) {
    return this.ticketsService.delete(user, id);
  }

  // 🔹 Asignar ticket a un agente (solo ADMIN)
@Roles(Role.ADMIN)
@Patch(':id/assign')
assignTicket(
  @CurrentUser() user: UserJwtPayload,
  @Param('id') id: string,
  @Body() body: { assigneeId: string },
) {
  return this.ticketsService.assignTicket(user, id, body.assigneeId);
}


}


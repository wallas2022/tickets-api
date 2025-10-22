import {   Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards, } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 🔹 Listar usuarios (ya lo tienes)
  @Roles(Role.ADMIN)
  @Get()
  async findAll(@Query('role') role?: Role) {
    return this.usersService.findAll(role);
  }

  // 🔹 Crear usuario nuevo
  @Roles(Role.ADMIN)
  @Post()
  async createUser(
    @Body()
    body: {
      name: string;
      email: string;
      password: string;
      role: Role;
    },
  ) {
    const hashed = await bcrypt.hash(body.password, 10);
    return this.usersService.createUser({
      name: body.name,
      email: body.email,
      password: hashed,
      role: body.role,
    });
  }
   // ✏️ Actualizar usuario
  @Roles(Role.ADMIN)
  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      email: string;
      password: string;
      role: Role;
    }>,
  ) {
    return this.usersService.updateUser(id, body);
  }

  // ❌ Eliminar usuario
  @Roles(Role.ADMIN)
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}



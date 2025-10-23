import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(role?: Role) {
    if (role) {
      return this.prisma.user.findMany({
        where: { role },
        select: { id: true, name: true, email: true, role: true },
      });
    }
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
    });
  }

  async create(data: { name: string; email: string; password: string; role?: Role }) {
    const exists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (exists) {
      throw new ConflictException('El correo ya está registrado.');
    }

    const hashed = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: data.role ?? Role.CUSTOMER,
      },
      select: { id: true, name: true, email: true, role: true },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';


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

  async createUser(data: {
  name: string;
  email: string;
  password: string;
  role: Role;
}) {
  return this.prisma.user.create({
    data,
    select: { id: true, name: true, email: true, role: true },
  });
}

async updateUser(
  id: string,
  data: Partial<{ name: string; email: string; password: string; role: Role }>,
) {
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  return this.prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true },
  });
}

async deleteUser(id: string) {
  return this.prisma.user.delete({
    where: { id },
  });
}
}

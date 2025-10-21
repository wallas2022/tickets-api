import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

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
}

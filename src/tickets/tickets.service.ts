import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Ticket, Role, Status } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: any): Promise<Ticket[]> {
    if (user.role === Role.ADMIN || user.role === Role.AGENT) {
      return this.prisma.ticket.findMany({
        include: { author: true, assignee: true },
        orderBy: { createdAt: 'desc' },
      });
    }
    // Si es CUSTOMER solo ve sus propios tickets
    return this.prisma.ticket.findMany({
      where: { authorId: user.userId },
      include: { author: true, assignee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(user: any, data: { title: string; description: string; priority: string }) {
    return this.prisma.ticket.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority as any,
        authorId: user.userId,
        code: `TCK-${Date.now()}`,
      },
    });
  }

  async updateStatus(user: any, id: string, status: Status) {
    if (user.role === Role.CUSTOMER)
      throw new ForbiddenException('No tienes permiso para cambiar el estado.');

    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    return this.prisma.ticket.update({
      where: { id },
      data: { status },
    });
  }

  async delete(user: any, id: string) {
    if (user.role !== Role.ADMIN)
      throw new ForbiddenException('Solo los administradores pueden eliminar tickets.');

    return this.prisma.ticket.delete({ where: { id } });
  }
}

import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Ticket, Role, Status } from '@prisma/client';
import { QueueService } from 'src/queue/queue.service';
import { UserJwtPayload } from 'src/auth/typs/user-jwt-payload.type';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService, private queueService: QueueService,) {}

  async findAll(
  user: UserJwtPayload,
  page: number,
  limit: number,
  search?: string,
) {
  const where: any = {};

  // 🎯 Lógica de visibilidad por rol
  if (user.role === 'ADMIN') {
    // sin filtro de usuario
  } else if (user.role === 'AGENT') {
    where.assigneeId = user.sub;
  } else if (user.role === 'CUSTOMER') {
    where.authorId = user.sub;
  }

  // 🔍 Búsqueda por texto
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];
  }

  const total = await this.prisma.ticket.count({ where });

  const tickets = await this.prisma.ticket.findMany({
    where,
    include: {
      author: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    data: tickets,
  };
}
 async create(user, data) {
    const next = Math.floor(1000 + Math.random() * 9000);
    const code = `TCK-${new Date().getFullYear()}-${next}`;

    const ticket = await this.prisma.ticket.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
       // authorId: user.id, // ⚠️ asegúrate de tener el id del usuario
        status: 'OPEN',
        code,
        author: {
        connect: { id: user.sub }, // ✅ conectar con usuario existente
      },
      },
    });

     // Encolar notificación
    await this.queueService.enqueueNotification('ticket_created', {
      code: ticket.code,
      title: ticket.title,
      createdBy: user.name,
    });

    return ticket;
  }



  async updateStatus(user, id, status) {
    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: { status },
    });

      // ✅ Encolar notificación de cambio de estado
    await this.queueService.enqueueNotification('ticket_status_changed', {
      code: ticket.code,
      status: ticket.status,
      updatedBy: user.name,
    });

    return ticket;
  
  }

  

  async delete(user: any, id: string) {
    if (user.role !== Role.ADMIN)
      throw new ForbiddenException('Solo los administradores pueden eliminar tickets.');

    return this.prisma.ticket.delete({ where: { id } });
  }


  async assignTicket(user: UserJwtPayload, id: string, assigneeId: string) {
  const ticket = await this.prisma.ticket.update({
    where: { id },
    data: { assigneeId },
    include: {
      author: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    },
  });

  // Encolar notificación
  await this.queueService.enqueueNotification('ticket_assigned', {
    code: ticket.code,
    assignedTo: ticket.assignee?.name,
    assignedBy: user.name,
  });

  return ticket;
}

  
async getStats(user: UserJwtPayload) {
    // 🟩 Si es ADMIN: ver estadísticas globales
    if (user.role === 'ADMIN') {
      const ticketsByUser = await this.prisma.ticket.groupBy({
        by: ['authorId'],
        _count: { id: true },
      });

      const ticketsByStatus = await this.prisma.ticket.groupBy({
        by: ['status'],
        _count: { id: true },
      });

      const users = await this.prisma.user.findMany({
        select: { id: true, name: true },
      });

      const userStats = ticketsByUser.map((t) => {
        const u = users.find((usr) => usr.id === t.authorId);
        return {
          name: u?.name || 'Desconocido',
          tickets: t._count.id,
        };
      });

      return {
        userStats,
        ticketsByStatus,
      };
    }

    // 🟦 Si es AGENT: ver sus tickets asignados
    if (user.role === 'AGENT') {
      const ticketsByStatus = await this.prisma.ticket.groupBy({
        by: ['status'],
        where: { assigneeId: user.sub },
        _count: { id: true },
      });

      return { userStats: [], ticketsByStatus };
    }

    // 🟨 Si es CUSTOMER: ver sus propios tickets
    if (user.role === 'CUSTOMER') {
      const ticketsByStatus = await this.prisma.ticket.groupBy({
        by: ['status'],
        where: { authorId: user.sub },
        _count: { id: true },
      });

      return { userStats: [], ticketsByStatus };
    }

    // fallback vacío
    return { userStats: [], ticketsByStatus: [] };
  }
  
}



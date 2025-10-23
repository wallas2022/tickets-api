import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Status, Priority } from '@prisma/client';
import { QueueService } from 'src/queue/queue.service';
import { UserJwtPayload } from 'src/auth/typs/user-jwt-payload.type';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly notifications: NotificationsService,
  ) {}

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
    totalPages: Math.max(1, Math.ceil(total / limit)),
    data: tickets,
  };
}
  async create(
    user: UserJwtPayload,
    data: { title: string; description: string; priority: string },
  ) {
    const next = Math.floor(1000 + Math.random() * 9000);
    const code = `TCK-${new Date().getFullYear()}-${next}`;

    const ticket = await this.prisma.ticket.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority as Priority,
        status: Status.OPEN,
        code,
        author: {
          connect: { id: user.sub },
        },
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });

    await this.queueService.enqueueNotification('ticket_created', {
      code: ticket.code,
      title: ticket.title,
      createdBy: user.name,
    });

    const admins = await this.prisma.user.findMany({
      where: { role: Role.ADMIN, isActive: true },
      select: { id: true },
    });

    await this.notifyUsers(
      admins.map((admin) => admin.id).filter((id) => id !== user.sub),
      'ticket_created',
      {
        code: ticket.code,
        title: ticket.title,
        createdBy: user.name,
        priority: ticket.priority,
      },
    );

    return ticket;
  }



  async updateStatus(user: UserJwtPayload, id: string, status: Status) {
    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: { status },
      include: {
        author: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    await this.queueService.enqueueNotification('ticket_status_changed', {
      code: ticket.code,
      status: ticket.status,
      updatedBy: user.name,
    });

    await this.notifyUsers(
      [ticket.authorId, ticket.assigneeId],
      'ticket_status_changed',
      {
        code: ticket.code,
        status: ticket.status,
        title: ticket.title,
        updatedBy: user.name,
      },
    );

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

  await this.notifyUsers(
    [ticket.assignee?.id, ticket.author?.id],
    'ticket_assigned',
    {
      code: ticket.code,
      assignedTo: ticket.assignee?.name,
      assignedBy: user.name,
      title: ticket.title,
    },
  );

  return ticket;
}

  
  async getStats(user: UserJwtPayload) {
    if (user.role === Role.ADMIN) {
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
          id: t.authorId,
          name: u?.name || 'Desconocido',
          tickets: t._count.id,
        };
      });

      return {
        userStats,
        ticketsByStatus,
        summary: this.buildStatusSummary(ticketsByStatus),
      };
    }

    if (user.role === Role.AGENT) {
      const ticketsByStatus = await this.prisma.ticket.groupBy({
        by: ['status'],
        where: { assigneeId: user.sub },
        _count: { id: true },
      });

      return {
        userStats: [],
        ticketsByStatus,
        summary: this.buildStatusSummary(ticketsByStatus),
      };
    }

    if (user.role === Role.CUSTOMER) {
      const ticketsByStatus = await this.prisma.ticket.groupBy({
        by: ['status'],
        where: { authorId: user.sub },
        _count: { id: true },
      });

      return {
        userStats: [],
        ticketsByStatus,
        summary: this.buildStatusSummary(ticketsByStatus),
      };
    }

    return {
      userStats: [],
      ticketsByStatus: [],
      summary: this.buildStatusSummary([]),
    };
  }

  private async notifyUsers(
    userIds: Array<string | null | undefined>,
    type: string,
    payload: Record<string, any>,
  ) {
    const unique = Array.from(
      new Set(userIds.filter((id): id is string => Boolean(id))),
    );

    if (!unique.length) return;

    await this.notifications.createMany(unique, type, payload);
  }

  private buildStatusSummary(
    ticketsByStatus: Array<{ status: Status; _count: { id: number } }>,
  ) {
    const summary = {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
    };

    ticketsByStatus.forEach((item) => {
      const count = item._count?.id ?? 0;
      summary.total += count;

      switch (item.status) {
        case Status.OPEN:
          summary.open = count;
          break;
        case Status.IN_PROGRESS:
          summary.inProgress = count;
          break;
        case Status.RESOLVED:
          summary.resolved = count;
          break;
        case Status.CLOSED:
          summary.closed = count;
          break;
        default:
          break;
      }
    });

    return summary;
  }
}

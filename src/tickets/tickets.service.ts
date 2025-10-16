import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Ticket, Role, Status } from '@prisma/client';
import { QueueService } from 'src/queue/queue.service';
import { UserJwtPayload } from 'src/auth/typs/user-jwt-payload.type';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService, private queueService: QueueService,) {}

  async findAll(user: UserJwtPayload) {
  // 🔹 Si es ADMIN: puede ver todos los tickets
  if (user.role === 'ADMIN') {
    return this.prisma.ticket.findMany({
      include: {
        author: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 🔹 Si es AGENT: solo los tickets asignados a él
  if (user.role === 'AGENT') {
    return this.prisma.ticket.findMany({
      where: { assigneeId: user.sub },
      include: {
        author: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 🔹 Si es CUSTOMER: solo los que él creó
  if (user.role === 'CUSTOMER') {
    return this.prisma.ticket.findMany({
      where: { authorId: user.sub },
      include: {
        author: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Por seguridad, si no hay rol definido
  return [];
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
        connect: { id: user.id }, // ✅ conectar con usuario existente
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

  

  
}


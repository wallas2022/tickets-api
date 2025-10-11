import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Ticket, Role, Status } from '@prisma/client';
import { QueueService } from 'src/queue/queue.service';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService, private queueService: QueueService,) {}

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

  

  
}


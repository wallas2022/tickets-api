import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TicketCommentsService {
  constructor(private prisma: PrismaService) {}

  async addComment(userId: string, ticketId: string, content: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { author: true, assignee: true },
    });

    if (!ticket) throw new NotFoundException('El ticket no existe');

    if (ticket.status === 'CLOSED')
      throw new ForbiddenException('No se pueden comentar tickets cerrados');

    // Validar si el usuario es cliente o agente
    const isClient = ticket.authorId === userId;
    const isAgent = ticket.assigneeId === userId;

    if (!isClient && !isAgent)
      throw new ForbiddenException('Solo el cliente o agente pueden comentar este ticket');

    return this.prisma.ticketComment.create({
      data: {
        content,
        ticketId,
        authorId: userId,
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });
  }

  async listComments(ticketId: string) {
    return this.prisma.ticketComment.findMany({
      where: { ticketId },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { UserJwtPayload } from '../auth/typs/user-jwt-payload.type';
import { Role } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(ticketId: string, user: UserJwtPayload) {
    const ticket = await this.ensureAccess(ticketId, user);

    const comments = await this.prisma.ticketComment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return {
      ticketId,
      comments,
      participants: {
        authorId: ticket.authorId,
        assigneeId: ticket.assigneeId,
      },
    };
  }

  async create(ticketId: string, user: UserJwtPayload, content: string) {
    if (!content || !content.trim()) {
      throw new BadRequestException('El comentario no puede estar vacío.');
    }

    const ticket = await this.ensureAccess(ticketId, user);

    const comment = await this.prisma.ticketComment.create({
      data: {
        ticketId,
        content: content.trim(),
        authorId: user.sub,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    const actorName = user.name ?? comment.author?.name ?? 'Usuario';

    const targets = [ticket.authorId, ticket.assigneeId].filter(
      (id): id is string => Boolean(id) && id !== user.sub,
    );

    if (targets.length > 0) {
      const preview =
        comment.content.length > 120
          ? `${comment.content.slice(0, 117)}...`
          : comment.content;

      await this.notifications.createMany(targets, 'ticket_commented', {
        code: ticket.code,
        title: ticket.title,
        commentedBy: actorName,
        commentPreview: preview,
        ticketId,
        commentId: comment.id,
      });

      await this.queueService.enqueueNotification('ticket_commented', {
        code: ticket.code,
        commentedBy: actorName,
        ticketId,
        commentId: comment.id,
      });
    }

    return comment;
  }

  private async ensureAccess(ticketId: string, user: UserJwtPayload) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        code: true,
        title: true,
        authorId: true,
        assigneeId: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado.');
    }

    if (user.role === Role.ADMIN) {
      return ticket;
    }

    if (user.role === Role.AGENT) {
      if (ticket.assigneeId !== user.sub) {
        throw new ForbiddenException(
          'Solo los agentes asignados pueden comentar este ticket.',
        );
      }
      return ticket;
    }

    if (user.role === Role.CUSTOMER) {
      if (ticket.authorId !== user.sub) {
        throw new ForbiddenException(
          'Solo el creador puede comentar este ticket.',
        );
      }
      return ticket;
    }

    throw new ForbiddenException('No tienes permisos para este ticket.');
  }
}

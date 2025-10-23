import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(
    userIds: string[],
    type: string,
    payload: Record<string, any>,
  ) {
    if (!userIds.length) return;

    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type,
        payload,
      })),
    });
  }

  async findForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });

    if (result.count === 0) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return this.prisma.notification.findUnique({ where: { id: notificationId } });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    return this.findForUser(userId);
  }
}

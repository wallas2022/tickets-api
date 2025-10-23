import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { PrismaService } from '../prisma/prisma.service';
import { QueueModule } from '../queue/queue.module'; // ✅ IMPORTANTE
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [QueueModule, NotificationsModule], // 👈 Agrega esta línea
  controllers: [TicketsController],
  providers: [TicketsService, PrismaService],
})
export class TicketsModule {}

import { Module } from '@nestjs/common';
import { TicketsModule } from './tickets/tickets.module';
import { AuthModule } from './auth/auth.module';
import { QueueModule } from './queue/queue.module';
import { NotificationProcessor } from './queue/notification.processor';
import { UsersModule } from './users/users.module';
import { TicketCommentsModule } from './ticket-comments/ticket-comments.module';

@Module({
  imports: [
    AuthModule,
    TicketsModule,
    QueueModule,
    UsersModule,
    TicketCommentsModule
  ],
  providers: [NotificationProcessor],
})
export class AppModule {}

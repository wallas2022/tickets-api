import { Module } from '@nestjs/common';
import { TicketsModule } from './tickets/tickets.module';
import { AuthModule } from './auth/auth.module';
import { QueueModule } from './queue/queue.module';
import { NotificationProcessor } from './queue/notification.processor';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [
    AuthModule,
    TicketsModule,
    QueueModule,
    UsersModule,
    NotificationsModule,
    CommentsModule,
  ],
  providers: [NotificationProcessor],
})
export class AppModule {}

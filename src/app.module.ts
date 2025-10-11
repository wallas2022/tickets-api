import { Module } from '@nestjs/common';
import { TicketsModule } from './tickets/tickets.module';
import { AuthModule } from './auth/auth.module';
import { QueueModule } from './queue/queue.module';
import { NotificationProcessor } from './queue/notification.processor';

@Module({
  imports: [
    AuthModule,
    TicketsModule,
    QueueModule,
  ],
  providers: [NotificationProcessor],
})
export class AppModule {}

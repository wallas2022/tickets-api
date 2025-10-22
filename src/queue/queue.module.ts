import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue.service';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    BullModule.registerQueue({
      name: 'notifications',
      connection: {
    host: 'localhost',
    port: 6379,
  }, // Cola para notificaciones
    }),
  ],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}

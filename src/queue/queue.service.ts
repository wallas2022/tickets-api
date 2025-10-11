import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(@InjectQueue('notifications') private notificationQueue: Queue) {}

  async enqueueNotification(jobName: string, payload: any) {
    this.logger.log(`📬 Encolando notificación: ${jobName}`);
    await this.notificationQueue.add(jobName, payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }
}

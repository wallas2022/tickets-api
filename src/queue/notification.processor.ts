import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  async process(job: Job<any>) {
    this.logger.log(`📨 Procesando notificación: ${job.name}`);
    this.logger.log(`Contenido: ${JSON.stringify(job.data, null, 2)}`);

    // Simulación de envío de correo / socket
    switch (job.name) {
      case 'ticket_created':
        this.logger.log(`🆕 Ticket creado por ${job.data.createdBy}`);
        break;
      case 'ticket_status_changed':
        this.logger.log(
          `🔁 Ticket ${job.data.code} cambiado a ${job.data.status} por ${job.data.updatedBy}`,
        );
        break;
      default:
        this.logger.warn(`⚠️ Tipo de notificación desconocido: ${job.name}`);
    }
  }
}

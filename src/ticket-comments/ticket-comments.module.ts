import { Module } from '@nestjs/common';
import { TicketCommentsService } from './ticket-comments.service';
import { TicketCommentsController } from './ticket-comments.controller';

@Module({
  providers: [TicketCommentsService],
  controllers: [TicketCommentsController]
})
export class TicketCommentsModule {}

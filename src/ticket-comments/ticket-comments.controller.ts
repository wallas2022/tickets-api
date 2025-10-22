import { Controller, Post, Body, Param, Get, Req, UseGuards } from '@nestjs/common';
import { TicketCommentsService } from './ticket-comments.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('tickets/:ticketId/comments')
@UseGuards(JwtAuthGuard)
export class TicketCommentsController {
  constructor(private commentsService: TicketCommentsService) {}

  @Post()
  async createComment(
    @Param('ticketId') ticketId: string,
    @Body('content') content: string,
    @Req() req,
  ) {
    return this.commentsService.addComment(req.user.sub, ticketId, content);
  }

  @Get()
  async list(@Param('ticketId') ticketId: string) {
    return this.commentsService.listComments(ticketId);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserJwtPayload } from '../auth/typs/user-jwt-payload.type';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets/:ticketId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Roles(Role.ADMIN, Role.AGENT, Role.CUSTOMER)
  @Get()
  findAll(
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: UserJwtPayload,
  ) {
    return this.commentsService.findAll(ticketId, user);
  }

  @Roles(Role.ADMIN, Role.AGENT, Role.CUSTOMER)
  @Post()
  create(
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: UserJwtPayload,
    @Body() body: { content: string },
  ) {
    return this.commentsService.create(ticketId, user, body.content);
  }
}

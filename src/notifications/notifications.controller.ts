import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserJwtPayload } from '../auth/typs/user-jwt-payload.type';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: UserJwtPayload) {
    return this.notificationsService.findForUser(user.sub);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: UserJwtPayload) {
    return this.notificationsService.markAllAsRead(user.sub);
  }

  @Patch(':id/read')
  markAsRead(
    @CurrentUser() user: UserJwtPayload,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(user.sub, id);
  }
}

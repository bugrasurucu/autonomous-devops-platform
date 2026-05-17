import {
    Controller, Get, Post, Patch, Delete,
    Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly svc: NotificationsService) { }

    /** GET /api/notifications/channels */
    @Get('channels')
    list(@Request() req: any) {
        return this.svc.listChannels(req.user.id);
    }

    /** POST /api/notifications/channels */
    @Post('channels')
    create(@Request() req: any, @Body() body: any) {
        return this.svc.createChannel(req.user.id, body);
    }

    /** PATCH /api/notifications/channels/:id */
    @Patch('channels/:id')
    update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
        return this.svc.updateChannel(req.user.id, id, body);
    }

    /** DELETE /api/notifications/channels/:id */
    @Delete('channels/:id')
    remove(@Request() req: any, @Param('id') id: string) {
        return this.svc.deleteChannel(req.user.id, id);
    }

    /** POST /api/notifications/channels/:id/test */
    @Post('channels/:id/test')
    test(@Request() req: any, @Param('id') id: string) {
        return this.svc.testChannel(req.user.id, id);
    }
}

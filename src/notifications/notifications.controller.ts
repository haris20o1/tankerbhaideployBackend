import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Post('register-token')
    async registerToken(@Body() body: { userId: string; expoPushToken: string }) {
        if (!body.userId || !body.expoPushToken) {
            throw new BadRequestException('userId and expoPushToken are required');
        }
        await this.notificationsService.registerToken(body.userId, body.expoPushToken);
        return { success: true };
    }
}

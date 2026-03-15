import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    registerToken(body: {
        userId: string;
        expoPushToken: string;
    }): Promise<{
        success: boolean;
    }>;
}

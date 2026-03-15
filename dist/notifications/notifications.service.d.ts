import { Model } from 'mongoose';
import { UserPushTokenDocument } from './user-push-token.schema';
export declare class NotificationsService {
    private readonly tokenModel;
    private readonly logger;
    private expo;
    constructor(tokenModel: Model<UserPushTokenDocument>);
    registerToken(userId: string, expoPushToken: string): Promise<void>;
    sendPushNotification(pushToken: string | undefined, title: string, body: string, data?: Record<string, any>): Promise<void>;
    sendBatchPushNotifications(tokens: string[], title: string, body: string, data?: Record<string, any>): Promise<void>;
    sendPushToUsers(userIds: string[], title: string, body: string, data?: Record<string, any>): Promise<void>;
    private handleTickets;
    private handleReceipts;
    private removeToken;
}

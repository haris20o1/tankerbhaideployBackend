import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt, ExpoPushReceiptId } from 'expo-server-sdk';
import { UserPushToken, UserPushTokenDocument } from './user-push-token.schema';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    private expo: Expo;

    constructor(
        @InjectModel(UserPushToken.name)
        private readonly tokenModel: Model<UserPushTokenDocument>,
    ) {
        this.expo = new Expo();
    }

    /**
     * Register or update an Expo push token for a given user.
     * Allows multiple tokens per user; prevents exact duplicates.
     */
    async registerToken(userId: string, expoPushToken: string): Promise<void> {
        if (!Expo.isExpoPushToken(expoPushToken)) {
            this.logger.warn(`Rejected invalid Expo push token: ${expoPushToken}`);
            return;
        }

        const userObjectId = new Types.ObjectId(userId);

        try {
            await this.tokenModel.updateOne(
                { userId: userObjectId, expoPushToken },
                { userId: userObjectId, expoPushToken },
                { upsert: true },
            );
        } catch (error) {
            this.logger.error('Failed to register Expo push token', error.stack || error);
            throw error;
        }
    }

    /**
     * Send a notification to a specific Expo Push Token.
     */
    async sendPushNotification(
        pushToken: string | undefined,
        title: string,
        body: string,
        data: Record<string, any> = {},
    ) {
        if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
            this.logger.warn(`[Push] Invalid or missing Expo push token: ${pushToken}`);
            return;
        }

        await this.sendBatchPushNotifications([pushToken], title, body, data);
    }

    /**
     * Send notifications to multiple tokens using chunking.
     */
    async sendBatchPushNotifications(
        tokens: string[],
        title: string,
        body: string,
        data: Record<string, any> = {},
    ) {
        const validTokens = tokens.filter(token => Expo.isExpoPushToken(token));
        
        if (validTokens.length === 0) return;

        const messages: ExpoPushMessage[] = validTokens.map(token => ({
            to: token,
            sound: 'default',
            title,
            body,
            data,
        }));

        const chunks = this.expo.chunkPushNotifications(messages);
        
        for (const chunk of chunks) {
            try {
                const tickets = await this.expo.sendPushNotificationsAsync(chunk);
                await this.handleTickets(chunk, tickets);
            } catch (error) {
                this.logger.error('[Push Batch Error]', error.stack || error);
            }
        }
    }

    /**
     * Send notifications to all Expo tokens belonging to a list of userIds.
     */
    async sendPushToUsers(
        userIds: string[],
        title: string,
        body: string,
        data: Record<string, any> = {},
    ): Promise<void> {
        if (!userIds.length) return;

        const userObjectIds = userIds.map(id => new Types.ObjectId(id));

        const tokens = await this.tokenModel
            .find({ userId: { $in: userObjectIds } })
            .lean()
            .exec();

        const expoTokens = tokens
            .map(t => t.expoPushToken)
            .filter(token => Expo.isExpoPushToken(token));

        if (!expoTokens.length) {
            this.logger.log('No valid Expo push tokens found for users.');
            return;
        }

        await this.sendBatchPushNotifications(expoTokens, title, body, data);
    }

    private async handleTickets(
        messages: ExpoPushMessage[],
        tickets: ExpoPushTicket[],
    ): Promise<void> {
        const receiptIds: ExpoPushReceiptId[] = [];

        tickets.forEach((ticket, index) => {
            const to = messages[index]?.to as string;

            if (ticket.status === 'ok') {
                this.logger.debug(`Push sent OK to ${to}`);
                if (ticket.id) {
                    receiptIds.push(ticket.id);
                }
            } else {
                this.logger.warn(
                    `Push ticket error for ${to}: ${ticket.message} (${ticket.details?.error})`,
                );
            }
        });

        if (!receiptIds.length) return;

        const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);

        for (const chunk of receiptIdChunks) {
            try {
                const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);
                await this.handleReceipts(receipts, messages, tickets);
            } catch (error) {
                this.logger.error('Error fetching push receipts', error.stack || error);
            }
        }
    }

    private async handleReceipts(
        receipts: { [id: string]: ExpoPushReceipt },
        messages: ExpoPushMessage[],
        tickets: ExpoPushTicket[],
    ): Promise<void> {
        for (const [receiptId, receipt] of Object.entries(receipts)) {
            if (receipt.status === 'ok') continue;

            const error = receipt.details?.error;
            this.logger.warn(`Push receipt error ${receiptId}: ${receipt.message} (${error})`);

            if (error === 'DeviceNotRegistered') {
                // const ticketIndex = tickets.findIndex(t => t.id === receiptId);
            //     if (ticketIndex >= 0) {
            //         const invalidToken = messages[ticketIndex]?.to as string;
            //         if (invalidToken) {
            //             await this.removeToken(invalidToken);
            //         }
            //     }
            }
        }
    }

    private async removeToken(expoPushToken: string): Promise<void> {
        try {
            await this.tokenModel.deleteMany({ expoPushToken }).exec();
            this.logger.log(`Removed invalid Expo push token ${expoPushToken}`);
        } catch (error) {
            this.logger.error('Failed to remove invalid push token', error.stack || error);
        }
    }
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const expo_server_sdk_1 = require("expo-server-sdk");
const user_push_token_schema_1 = require("./user-push-token.schema");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    tokenModel;
    logger = new common_1.Logger(NotificationsService_1.name);
    expo;
    constructor(tokenModel) {
        this.tokenModel = tokenModel;
        this.expo = new expo_server_sdk_1.Expo();
    }
    async registerToken(userId, expoPushToken) {
        if (!expo_server_sdk_1.Expo.isExpoPushToken(expoPushToken)) {
            this.logger.warn(`Rejected invalid Expo push token: ${expoPushToken}`);
            return;
        }
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
        try {
            await this.tokenModel.updateOne({ userId: userObjectId, expoPushToken }, { userId: userObjectId, expoPushToken }, { upsert: true });
        }
        catch (error) {
            this.logger.error('Failed to register Expo push token', error.stack || error);
            throw error;
        }
    }
    async sendPushNotification(pushToken, title, body, data = {}) {
        if (!pushToken || !expo_server_sdk_1.Expo.isExpoPushToken(pushToken)) {
            this.logger.warn(`[Push] Invalid or missing Expo push token: ${pushToken}`);
            return;
        }
        await this.sendBatchPushNotifications([pushToken], title, body, data);
    }
    async sendBatchPushNotifications(tokens, title, body, data = {}) {
        const validTokens = tokens.filter(token => expo_server_sdk_1.Expo.isExpoPushToken(token));
        if (validTokens.length === 0)
            return;
        const messages = validTokens.map(token => ({
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
            }
            catch (error) {
                this.logger.error('[Push Batch Error]', error.stack || error);
            }
        }
    }
    async sendPushToUsers(userIds, title, body, data = {}) {
        if (!userIds.length)
            return;
        const userObjectIds = userIds.map(id => new mongoose_2.Types.ObjectId(id));
        const tokens = await this.tokenModel
            .find({ userId: { $in: userObjectIds } })
            .lean()
            .exec();
        const expoTokens = tokens
            .map(t => t.expoPushToken)
            .filter(token => expo_server_sdk_1.Expo.isExpoPushToken(token));
        if (!expoTokens.length) {
            this.logger.log('No valid Expo push tokens found for users.');
            return;
        }
        await this.sendBatchPushNotifications(expoTokens, title, body, data);
    }
    async handleTickets(messages, tickets) {
        const receiptIds = [];
        tickets.forEach((ticket, index) => {
            const to = messages[index]?.to;
            if (ticket.status === 'ok') {
                this.logger.debug(`Push sent OK to ${to}`);
                if (ticket.id) {
                    receiptIds.push(ticket.id);
                }
            }
            else {
                this.logger.warn(`Push ticket error for ${to}: ${ticket.message} (${ticket.details?.error})`);
            }
        });
        if (!receiptIds.length)
            return;
        const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);
        for (const chunk of receiptIdChunks) {
            try {
                const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);
                await this.handleReceipts(receipts, messages, tickets);
            }
            catch (error) {
                this.logger.error('Error fetching push receipts', error.stack || error);
            }
        }
    }
    async handleReceipts(receipts, messages, tickets) {
        for (const [receiptId, receipt] of Object.entries(receipts)) {
            if (receipt.status === 'ok')
                continue;
            const error = receipt.details?.error;
            this.logger.warn(`Push receipt error ${receiptId}: ${receipt.message} (${error})`);
            if (error === 'DeviceNotRegistered') {
            }
        }
    }
    async removeToken(expoPushToken) {
        try {
            await this.tokenModel.deleteMany({ expoPushToken }).exec();
            this.logger.log(`Removed invalid Expo push token ${expoPushToken}`);
        }
        catch (error) {
            this.logger.error('Failed to remove invalid push token', error.stack || error);
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_push_token_schema_1.UserPushToken.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map
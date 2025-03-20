"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const rabbitmq_1 = __importDefault(require("../config/rabbitmq"));
const notification_repository_1 = __importDefault(require("../repositories/notification.repository"));
const ApiError_1 = require("../utils/ApiError");
class NotificationService {
    constructor() {
        this.channel = null;
    }
    async initialize() {
        await rabbitmq_1.default.initialize();
        this.channel = rabbitmq_1.default.getChannel();
        this.setupConsumers();
    }
    async setupConsumers() {
        var _a, _b;
        // Task notificaties consumer
        (_a = this.channel) === null || _a === void 0 ? void 0 : _a.consume('task.notifications', async (msg) => {
            var _a, _b;
            if (!msg)
                return;
            try {
                const content = JSON.parse(msg.content.toString());
                await this.processTaskNotification(content);
                (_a = this.channel) === null || _a === void 0 ? void 0 : _a.ack(msg);
            }
            catch (error) {
                console.error('Fout bij verwerken task notificatie:', error);
                // Negative acknowledge bij verwerkingsfout
                (_b = this.channel) === null || _b === void 0 ? void 0 : _b.nack(msg, false, false);
            }
        });
        // Discord notificaties consumer
        (_b = this.channel) === null || _b === void 0 ? void 0 : _b.consume('discord.notifications', async (msg) => {
            var _a, _b;
            if (!msg)
                return;
            try {
                const content = JSON.parse(msg.content.toString());
                await this.processDiscordNotification(content);
                (_a = this.channel) === null || _a === void 0 ? void 0 : _a.ack(msg);
            }
            catch (error) {
                console.error('Fout bij verwerken discord notificatie:', error);
                (_b = this.channel) === null || _b === void 0 ? void 0 : _b.nack(msg, false, false);
            }
        });
    }
    async createNotification(data) {
        var _a;
        try {
            const notification = await notification_repository_1.default.createNotification(data);
            // Publiceer notificatie naar juiste queue op basis van channelType
            const routingKey = `${(_a = data.type) === null || _a === void 0 ? void 0 : _a.toLowerCase()}.notification`;
            await rabbitmq_1.default.publishNotification(routingKey, Object.assign({ notificationId: notification._id }, data));
            return notification;
        }
        catch (error) {
            throw new ApiError_1.ApiError(500, 'Fout bij aanmaken notificatie');
        }
    }
    async processTaskNotification(content) {
        const { notificationId, userId, title, message } = content;
        try {
            // Verwerk task notificatie (bijv. websocket push)
            console.log(`Task notificatie voor user ${userId}: ${title}`);
            // Update notificatie status
            await notification_repository_1.default.markAsSent(notificationId);
        }
        catch (error) {
            console.error('Fout bij verwerken task notificatie:', error);
            await notification_repository_1.default.markAsFailed(notificationId, error);
        }
    }
    async processDiscordNotification(content) {
        const { notificationId, userId, title, message } = content;
        try {
            // Verwerk Discord notificatie
            // TODO: Integreer met Discord service voor het versturen van berichten
            console.log(`Discord notificatie voor user ${userId}: ${title}`);
            await notification_repository_1.default.markAsSent(notificationId);
        }
        catch (error) {
            console.error('Fout bij verwerken discord notificatie:', error);
            await notification_repository_1.default.markAsFailed(notificationId, error);
        }
    }
    async getUserNotifications(userId, status, limit) {
        return notification_repository_1.default.findByUserAndStatus(userId, status, limit);
    }
    async markNotificationAsSeen(notificationId) {
        return notification_repository_1.default.update(notificationId, {
            status: 'SENT',
            sentAt: new Date()
        });
    }
}
exports.NotificationService = NotificationService;
exports.default = new NotificationService();
//# sourceMappingURL=notification.service.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRepository = void 0;
const base_repository_1 = require("./base.repository");
const Notification_1 = __importDefault(require("../models/Notification"));
class NotificationRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(Notification_1.default);
    }
    async findPendingNotifications(channelType) {
        return this.find({
            status: 'PENDING',
            channelType,
        });
    }
    async markAsSent(notificationId) {
        return this.update(notificationId, {
            status: 'SENT',
            sentAt: new Date(),
        });
    }
    async markAsFailed(notificationId, error) {
        return this.update(notificationId, {
            status: 'FAILED',
            'metadata.error': error,
        });
    }
    async findByUserAndStatus(userId, status, limit = 10) {
        const query = { userId };
        if (status) {
            query.status = status;
        }
        const options = {
            limit,
            sort: { createdAt: -1 }
        };
        return this.find(query, options);
    }
    async createNotification(notificationData) {
        return this.create(Object.assign(Object.assign({}, notificationData), { status: 'PENDING' }));
    }
}
exports.NotificationRepository = NotificationRepository;
exports.default = new NotificationRepository();
//# sourceMappingURL=notification.repository.js.map
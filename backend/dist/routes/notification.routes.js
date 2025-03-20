"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_service_1 = __importDefault(require("../services/notification.service"));
const ApiError_1 = require("../utils/ApiError");
const router = (0, express_1.Router)();
// Ophalen van notificaties voor een gebruiker
router.get('/user/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { status, limit } = req.query;
        const notifications = await notification_service_1.default.getUserNotifications(userId, status, limit ? parseInt(limit) : undefined);
        res.json(notifications);
    }
    catch (error) {
        next(error);
    }
});
// Aanmaken van een nieuwe notificatie
router.post('/', async (req, res, next) => {
    try {
        const notificationData = req.body;
        if (!notificationData.userId || !notificationData.type || !notificationData.message) {
            throw new ApiError_1.ApiError(400, 'Ontbrekende verplichte velden');
        }
        const notification = await notification_service_1.default.createNotification(notificationData);
        res.status(201).json(notification);
    }
    catch (error) {
        next(error);
    }
});
// Markeer notificatie als gezien
router.patch('/:notificationId/seen', async (req, res, next) => {
    try {
        const { notificationId } = req.params;
        const notification = await notification_service_1.default.markNotificationAsSeen(notificationId);
        if (!notification) {
            throw new ApiError_1.ApiError(404, 'Notificatie niet gevonden');
        }
        res.json(notification);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=notification.routes.js.map
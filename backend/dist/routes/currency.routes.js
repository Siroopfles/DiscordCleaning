"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const currency_service_1 = require("../services/currency.service");
const validateRequest_1 = require("../middleware/validateRequest");
const auth_1 = require("../middleware/auth");
const errors_1 = require("../utils/errors");
const router = (0, express_1.Router)();
// Apply authentication to all routes
router.use(auth_1.requireAuth);
// Get user balance
router.get('/:serverId/balance', async (req, res, next) => {
    try {
        const { serverId } = req.params;
        const { userId } = req.user;
        const balance = await currency_service_1.currencyService.getBalance(userId, serverId);
        res.json(balance);
    }
    catch (error) {
        next(error);
    }
});
// Get transaction history
router.get('/:serverId/transactions', async (req, res, next) => {
    try {
        const { serverId } = req.params;
        const { userId } = req.user;
        const { page = '1', limit = '10' } = req.query;
        const result = await currency_service_1.currencyService.getTransactionHistory(userId, serverId, parseInt(page), parseInt(limit));
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
// Get server leaderboard
router.get('/:serverId/leaderboard', async (req, res, next) => {
    try {
        const { serverId } = req.params;
        const { limit = '10' } = req.query;
        const leaderboard = await currency_service_1.currencyService.getLeaderboard(serverId, parseInt(limit));
        res.json(leaderboard);
    }
    catch (error) {
        next(error);
    }
});
// Get user statistics
router.get('/:serverId/statistics', async (req, res, next) => {
    try {
        const { serverId } = req.params;
        const { userId } = req.user;
        const stats = await currency_service_1.currencyService.getUserStatistics(userId, serverId);
        res.json(stats);
    }
    catch (error) {
        next(error);
    }
});
// Transfer currency to another user
router.post('/:serverId/transfer', (0, validateRequest_1.validateRequest)({
    body: {
        toUserId: { type: 'string', required: true },
        amount: { type: 'number', required: true, min: 1 },
        description: { type: 'string', required: true }
    }
}), async (req, res, next) => {
    try {
        const { serverId } = req.params;
        const { userId: fromUserId } = req.user;
        const { toUserId, amount, description } = req.body;
        if (fromUserId === toUserId) {
            throw new errors_1.BadRequestError('Cannot transfer currency to yourself');
        }
        const result = await currency_service_1.currencyService.transferCurrency(fromUserId, toUserId, serverId, amount, description);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
// Admin route: Add currency reward
router.post('/:serverId/reward', (0, validateRequest_1.validateRequest)({
    body: {
        userId: { type: 'string', required: true },
        amount: { type: 'number', required: true, min: 1 },
        description: { type: 'string', required: true },
        taskId: { type: 'string' }
    }
}), (0, auth_1.requireRole)(['ADMIN']), async (req, res, next) => {
    try {
        const { serverId } = req.params;
        const { userId, amount, description, taskId } = req.body;
        const result = await currency_service_1.currencyService.addReward(userId, serverId, amount, description, taskId);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
// Admin route: Deduct currency
router.post('/:serverId/deduct', (0, validateRequest_1.validateRequest)({
    body: {
        userId: { type: 'string', required: true },
        amount: { type: 'number', required: true, min: 1 },
        description: { type: 'string', required: true }
    }
}), (0, auth_1.requireRole)(['ADMIN']), async (req, res, next) => {
    try {
        const { serverId } = req.params;
        const { userId, amount, description } = req.body;
        const result = await currency_service_1.currencyService.deductCurrency(userId, serverId, amount, description);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=currency.routes.js.map
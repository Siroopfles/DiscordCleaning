"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.currencyService = exports.CurrencyService = void 0;
const Currency_1 = require("../models/Currency");
const currency_repository_1 = require("../repositories/currency.repository");
const notification_service_1 = require("./notification.service");
const errors_1 = require("../utils/errors");
const mongoose_1 = __importDefault(require("mongoose"));
const notificationService = new notification_service_1.NotificationService();
class CurrencyService {
    constructor() {
        this.MIN_TRANSFER_AMOUNT = 1;
        this.MAX_REWARD_AMOUNT = 1000;
    }
    async getBalance(userId, serverId) {
        const balance = await currency_repository_1.currencyRepository.getBalance(userId, serverId);
        if (!balance) {
            return await currency_repository_1.currencyRepository.createBalance(userId, serverId);
        }
        return balance;
    }
    async addReward(userId, serverId, amount, description, taskId) {
        if (amount <= 0 || amount > this.MAX_REWARD_AMOUNT) {
            throw new errors_1.BadRequestError(`Reward amount must be between 1 and ${this.MAX_REWARD_AMOUNT}`);
        }
        const [updatedBalance] = await Promise.all([
            currency_repository_1.currencyRepository.updateBalance(userId, serverId, amount),
            currency_repository_1.currencyRepository.createTransaction({
                userId,
                serverId,
                amount,
                type: 'REWARD',
                description,
                relatedTaskId: taskId
            })
        ]);
        if (!updatedBalance) {
            throw new Error('Failed to update balance');
        }
        // Send notification
        await notificationService.createNotification({
            userId: new mongoose_1.default.Types.ObjectId(userId),
            type: 'SYSTEM',
            title: 'Currency Reward Received',
            message: `You received ${amount} currency: ${description}`,
            channelType: 'DISCORD',
            metadata: {
                amount,
                newBalance: updatedBalance.balance,
                taskId,
                serverId
            }
        });
        return updatedBalance;
    }
    async deductCurrency(userId, serverId, amount, description) {
        const currentBalance = await this.getBalance(userId, serverId);
        if (currentBalance.balance < amount) {
            throw new errors_1.BadRequestError('Insufficient balance');
        }
        const [updatedBalance] = await Promise.all([
            currency_repository_1.currencyRepository.updateBalance(userId, serverId, -amount),
            currency_repository_1.currencyRepository.createTransaction({
                userId,
                serverId,
                amount: -amount,
                type: 'DEDUCTION',
                description
            })
        ]);
        if (!updatedBalance) {
            throw new Error('Failed to update balance');
        }
        // Send notification
        await notificationService.createNotification({
            userId: new mongoose_1.default.Types.ObjectId(userId),
            type: 'SYSTEM',
            title: 'Currency Deducted',
            message: `${amount} currency was deducted: ${description}`,
            channelType: 'DISCORD',
            metadata: {
                amount,
                newBalance: updatedBalance.balance,
                serverId
            }
        });
        return updatedBalance;
    }
    async transferCurrency(fromUserId, toUserId, serverId, amount, description) {
        if (amount < this.MIN_TRANSFER_AMOUNT) {
            throw new errors_1.BadRequestError('Transfer amount must be at least 1');
        }
        if (fromUserId === toUserId) {
            throw new errors_1.BadRequestError('Cannot transfer to self');
        }
        const fromBalance = await this.getBalance(fromUserId, serverId);
        if (fromBalance.balance < amount) {
            throw new errors_1.BadRequestError('Insufficient balance for transfer');
        }
        // Perform transfer
        const [updatedFromBalance, updatedToBalance] = await Promise.all([
            currency_repository_1.currencyRepository.updateBalance(fromUserId, serverId, -amount),
            currency_repository_1.currencyRepository.updateBalance(toUserId, serverId, amount),
            currency_repository_1.currencyRepository.createTransaction({
                userId: fromUserId,
                serverId,
                amount: -amount,
                type: 'TRANSFER',
                description,
                relatedUserId: toUserId
            }),
            currency_repository_1.currencyRepository.createTransaction({
                userId: toUserId,
                serverId,
                amount,
                type: 'TRANSFER',
                description,
                relatedUserId: fromUserId
            })
        ]);
        if (!updatedFromBalance || !updatedToBalance) {
            throw new Error('Failed to complete transfer');
        }
        // Send notifications to both users
        await Promise.all([
            notificationService.createNotification({
                userId: new mongoose_1.default.Types.ObjectId(fromUserId),
                type: 'SYSTEM',
                title: 'Currency Transfer Sent',
                message: `You sent ${amount} currency to <@${toUserId}>`,
                channelType: 'DISCORD',
                metadata: {
                    amount,
                    newBalance: updatedFromBalance.balance,
                    recipientId: toUserId,
                    serverId
                }
            }),
            notificationService.createNotification({
                userId: new mongoose_1.default.Types.ObjectId(toUserId),
                type: 'SYSTEM',
                title: 'Currency Transfer Received',
                message: `You received ${amount} currency from <@${fromUserId}>`,
                channelType: 'DISCORD',
                metadata: {
                    amount,
                    newBalance: updatedToBalance.balance,
                    senderId: fromUserId,
                    serverId
                }
            })
        ]);
        return { fromBalance: updatedFromBalance, toBalance: updatedToBalance };
    }
    async getTransactionHistory(userId, serverId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const skipCount = (page - 1) * limit;
        const [transactions, totalCount] = await Promise.all([
            currency_repository_1.currencyRepository.getTransactions(userId, serverId, limit, skipCount),
            Currency_1.Transaction.countDocuments({ userId, serverId })
        ]);
        return {
            transactions,
            hasMore: totalCount > skipCount + transactions.length
        };
    }
    async getLeaderboard(serverId, limit = 10) {
        return await currency_repository_1.currencyRepository.getServerTopBalances(serverId, limit);
    }
    async getUserStatistics(userId, serverId) {
        return await currency_repository_1.currencyRepository.getUserStatistics(userId, serverId);
    }
}
exports.CurrencyService = CurrencyService;
exports.currencyService = new CurrencyService();
//# sourceMappingURL=currency.service.js.map
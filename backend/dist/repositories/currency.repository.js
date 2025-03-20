"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.currencyRepository = exports.CurrencyRepository = void 0;
const Currency_1 = require("../models/Currency");
class CurrencyRepository {
    // Currency balance operations
    async getBalance(userId, serverId) {
        return await Currency_1.Currency.findOne({ userId, serverId });
    }
    async createBalance(userId, serverId, initialBalance = 0) {
        const currency = new Currency_1.Currency({
            userId,
            serverId,
            balance: initialBalance
        });
        return await currency.save();
    }
    async updateBalance(userId, serverId, amount) {
        const result = await Currency_1.Currency.findOneAndUpdate({ userId, serverId }, { $inc: { balance: amount } }, { new: true });
        if (!result && amount > 0) {
            // If no balance exists and amount is positive, create new balance
            return await this.createBalance(userId, serverId, amount);
        }
        return result;
    }
    // Transaction operations
    async createTransaction(transactionData) {
        const transaction = new Currency_1.Transaction(Object.assign(Object.assign({}, transactionData), { timestamp: new Date() }));
        return await transaction.save();
    }
    async getTransactions(userId, serverId, limit = 10, skip = 0) {
        return await Currency_1.Transaction.find({ userId, serverId })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);
    }
    async getServerTransactions(serverId, limit = 10, skip = 0) {
        return await Currency_1.Transaction.find({ serverId })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);
    }
    // Aggregate operations
    async getServerTopBalances(serverId, limit = 10) {
        return await Currency_1.Currency.find({ serverId })
            .sort({ balance: -1 })
            .limit(limit);
    }
    async getTotalServerBalance(serverId) {
        const result = await Currency_1.Currency.aggregate([
            { $match: { serverId } },
            { $group: { _id: null, total: { $sum: '$balance' } } }
        ]);
        return result.length > 0 ? result[0].total : 0;
    }
    // User statistics
    async getUserStatistics(userId, serverId) {
        const [balance, transactions] = await Promise.all([
            this.getBalance(userId, serverId),
            Currency_1.Transaction.aggregate([
                { $match: { userId, serverId } },
                { $group: {
                        _id: '$type',
                        total: { $sum: '$amount' },
                        count: { $sum: 1 }
                    } }
            ])
        ]);
        const stats = transactions.reduce((acc, curr) => {
            acc[curr._id.toLowerCase()] = {
                total: curr.total,
                count: curr.count
            };
            return acc;
        }, {});
        return {
            currentBalance: (balance === null || balance === void 0 ? void 0 : balance.balance) || 0,
            statistics: stats
        };
    }
}
exports.CurrencyRepository = CurrencyRepository;
exports.currencyRepository = new CurrencyRepository();
//# sourceMappingURL=currency.repository.js.map
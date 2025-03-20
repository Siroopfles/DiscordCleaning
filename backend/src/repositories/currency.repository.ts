import { Currency, Transaction, ICurrency, ITransaction, CreateTransactionDto } from '../models/Currency';

export class CurrencyRepository {
  // Currency balance operations
  async getBalance(userId: string, serverId: string): Promise<ICurrency | null> {
    return await Currency.findOne({ userId, serverId });
  }

  async createBalance(userId: string, serverId: string, initialBalance: number = 0): Promise<ICurrency> {
    const currency = new Currency({
      userId,
      serverId,
      balance: initialBalance
    });
    return await currency.save();
  }

  async updateBalance(userId: string, serverId: string, amount: number): Promise<ICurrency | null> {
    const result = await Currency.findOneAndUpdate(
      { userId, serverId },
      { $inc: { balance: amount } },
      { new: true }
    );

    if (!result && amount > 0) {
      // If no balance exists and amount is positive, create new balance
      return await this.createBalance(userId, serverId, amount);
    }

    return result;
  }

  // Transaction operations
  async createTransaction(transactionData: CreateTransactionDto): Promise<ITransaction> {
    const transaction = new Transaction({
      ...transactionData,
      timestamp: new Date()
    });
    return await transaction.save();
  }

  async getTransactions(
    userId: string,
    serverId: string,
    limit: number = 10,
    skip: number = 0
  ): Promise<ITransaction[]> {
    return await Transaction.find({ userId, serverId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
  }

  async getServerTransactions(
    serverId: string,
    limit: number = 10,
    skip: number = 0
  ): Promise<ITransaction[]> {
    return await Transaction.find({ serverId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
  }

  // Aggregate operations
  async getServerTopBalances(serverId: string, limit: number = 10): Promise<ICurrency[]> {
    return await Currency.find({ serverId })
      .sort({ balance: -1 })
      .limit(limit);
  }

  async getTotalServerBalance(serverId: string): Promise<number> {
    const result = await Currency.aggregate([
      { $match: { serverId } },
      { $group: { _id: null, total: { $sum: '$balance' } } }
    ]);
    return result.length > 0 ? result[0].total : 0;
  }

  // User statistics
  async getUserStatistics(userId: string, serverId: string) {
    const [balance, transactions] = await Promise.all([
      this.getBalance(userId, serverId),
      Transaction.aggregate([
        { $match: { userId, serverId } },
        { $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }}
      ])
    ]);

    const stats = transactions.reduce((acc: any, curr) => {
      acc[curr._id.toLowerCase()] = {
        total: curr.total,
        count: curr.count
      };
      return acc;
    }, {});

    return {
      currentBalance: balance?.balance || 0,
      statistics: stats
    };
  }
}

export const currencyRepository = new CurrencyRepository();
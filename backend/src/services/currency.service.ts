import { ICurrency, ITransaction, Transaction } from '../models/Currency';
import { currencyRepository } from '../repositories/currency.repository';
import { NotificationService } from './notification.service';
import { BadRequestError, NotFoundError } from '../utils/errors';
import mongoose from 'mongoose';

const notificationService = new NotificationService();

export class CurrencyService {
  private readonly MIN_TRANSFER_AMOUNT = 1;
  private readonly MAX_REWARD_AMOUNT = 1000;

  async getBalance(userId: string, serverId: string): Promise<ICurrency> {
    const balance = await currencyRepository.getBalance(userId, serverId);
    if (!balance) {
      return await currencyRepository.createBalance(userId, serverId);
    }
    return balance;
  }

  async addReward(
    userId: string, 
    serverId: string, 
    amount: number, 
    description: string,
    taskId?: string
  ): Promise<ICurrency> {
    if (amount <= 0 || amount > this.MAX_REWARD_AMOUNT) {
      throw new BadRequestError(`Reward amount must be between 1 and ${this.MAX_REWARD_AMOUNT}`);
    }

    const [updatedBalance] = await Promise.all([
      currencyRepository.updateBalance(userId, serverId, amount),
      currencyRepository.createTransaction({
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
      userId: new mongoose.Types.ObjectId(userId),
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

  async deductCurrency(
    userId: string,
    serverId: string,
    amount: number,
    description: string
  ): Promise<ICurrency> {
    const currentBalance = await this.getBalance(userId, serverId);
    
    if (currentBalance.balance < amount) {
      throw new BadRequestError('Insufficient balance');
    }

    const [updatedBalance] = await Promise.all([
      currencyRepository.updateBalance(userId, serverId, -amount),
      currencyRepository.createTransaction({
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
      userId: new mongoose.Types.ObjectId(userId),
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

  async transferCurrency(
    fromUserId: string,
    toUserId: string,
    serverId: string,
    amount: number,
    description: string
  ): Promise<{ fromBalance: ICurrency; toBalance: ICurrency }> {
    if (amount < this.MIN_TRANSFER_AMOUNT) {
      throw new BadRequestError('Transfer amount must be at least 1');
    }

    if (fromUserId === toUserId) {
      throw new BadRequestError('Cannot transfer to self');
    }

    const fromBalance = await this.getBalance(fromUserId, serverId);
    if (fromBalance.balance < amount) {
      throw new BadRequestError('Insufficient balance for transfer');
    }

    // Perform transfer
    const [updatedFromBalance, updatedToBalance] = await Promise.all([
      currencyRepository.updateBalance(fromUserId, serverId, -amount),
      currencyRepository.updateBalance(toUserId, serverId, amount),
      currencyRepository.createTransaction({
        userId: fromUserId,
        serverId,
        amount: -amount,
        type: 'TRANSFER',
        description,
        relatedUserId: toUserId
      }),
      currencyRepository.createTransaction({
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
        userId: new mongoose.Types.ObjectId(fromUserId),
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
        userId: new mongoose.Types.ObjectId(toUserId),
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

  async getTransactionHistory(
    userId: string,
    serverId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ transactions: ITransaction[]; hasMore: boolean }> {
    const skip = (page - 1) * limit;
    const skipCount = (page - 1) * limit;
    const [transactions, totalCount] = await Promise.all([
      currencyRepository.getTransactions(userId, serverId, limit, skipCount),
      Transaction.countDocuments({ userId, serverId })
    ]);

    return {
      transactions,
      hasMore: (totalCount as number) > skipCount + transactions.length
    };
  }

  async getLeaderboard(serverId: string, limit: number = 10): Promise<ICurrency[]> {
    return await currencyRepository.getServerTopBalances(serverId, limit);
  }

  async getUserStatistics(userId: string, serverId: string) {
    return await currencyRepository.getUserStatistics(userId, serverId);
  }
}

export const currencyService = new CurrencyService();
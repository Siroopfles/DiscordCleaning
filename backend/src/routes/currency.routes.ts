import { Router } from 'express';
import { currencyService } from '../services/currency.service';
import { validateRequest } from '../middleware/validateRequest';
import { requireAuth, requireRole } from '../middleware/auth';
import { BadRequestError } from '../utils/errors';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

// Get user balance
router.get('/:serverId/balance', async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const { userId } = req.user!;

    const balance = await currencyService.getBalance(userId, serverId);
    res.json(balance);
  } catch (error) {
    next(error);
  }
});

// Get transaction history
router.get('/:serverId/transactions', async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const { userId } = req.user!;
    const { page = '1', limit = '10' } = req.query;

    const result = await currencyService.getTransactionHistory(
      userId,
      serverId,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get server leaderboard
router.get('/:serverId/leaderboard', async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const { limit = '10' } = req.query;

    const leaderboard = await currencyService.getLeaderboard(
      serverId,
      parseInt(limit as string)
    );

    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
});

// Get user statistics
router.get('/:serverId/statistics', async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const { userId } = req.user!;

    const stats = await currencyService.getUserStatistics(userId, serverId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Transfer currency to another user
router.post('/:serverId/transfer', validateRequest({
  body: {
    toUserId: { type: 'string', required: true },
    amount: { type: 'number', required: true, min: 1 },
    description: { type: 'string', required: true }
  }
}), async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const { userId: fromUserId } = req.user!;
    const { toUserId, amount, description } = req.body;

    if (fromUserId === toUserId) {
      throw new BadRequestError('Cannot transfer currency to yourself');
    }

    const result = await currencyService.transferCurrency(
      fromUserId,
      toUserId,
      serverId,
      amount,
      description
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Admin route: Add currency reward
router.post('/:serverId/reward', validateRequest({
  body: {
    userId: { type: 'string', required: true },
    amount: { type: 'number', required: true, min: 1 },
    description: { type: 'string', required: true },
    taskId: { type: 'string' }
  }
}), requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const { userId, amount, description, taskId } = req.body;

    const result = await currencyService.addReward(
      userId,
      serverId,
      amount,
      description,
      taskId
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Admin route: Deduct currency
router.post('/:serverId/deduct', validateRequest({
  body: {
    userId: { type: 'string', required: true },
    amount: { type: 'number', required: true, min: 1 },
    description: { type: 'string', required: true }
  }
}), requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const { userId, amount, description } = req.body;

    const result = await currencyService.deductCurrency(
      userId,
      serverId,
      amount,
      description
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
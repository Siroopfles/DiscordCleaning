import { EventEmitter } from 'events';
import { PointsService } from '../../services/PointsService';
import { PointsRepository } from '../../repositories/PointsRepository';
import { AchievementService } from '../../services/AchievementService';
import { PointSource } from '../../types/points';

describe('PointsService', () => {
  let pointsService: PointsService;
  let pointsRepository: jest.Mocked<PointsRepository>;
  let achievementService: jest.Mocked<AchievementService>;
  let eventEmitter: EventEmitter;

  beforeEach(() => {
    pointsRepository = {
      updatePoints: jest.fn(),
      getUserPoints: jest.fn(),
      getTopUsers: jest.fn(),
      resetPoints: jest.fn()
    } as any;

    achievementService = {
      getAchievement: jest.fn(),
      progressAchievement: jest.fn()
    } as any;

    eventEmitter = new EventEmitter();
    pointsService = new PointsService(pointsRepository, achievementService, eventEmitter);
  });

  describe('processTransaction', () => {
    it('should process a points transaction and emit event', async () => {
      const transaction = {
        userId: 'user123',
        amount: 100,
        source: 'TASK_COMPLETION' as PointSource,
        metadata: { taskId: 'task123' }
      };

      pointsRepository.getUserPoints.mockResolvedValue({
        current: 100,
        total: 500,
        history: []
      });

      let emittedEvent: any;
      eventEmitter.on('points:updated', (data) => {
        emittedEvent = data;
      });

      await pointsService.processTransaction(transaction);

      expect(pointsRepository.updatePoints).toHaveBeenCalledWith(
        transaction.userId,
        transaction.amount,
        transaction.source
      );

      expect(emittedEvent).toEqual({
        userId: transaction.userId,
        amount: transaction.amount,
        newTotal: 500,
        source: transaction.source,
        metadata: transaction.metadata
      });
    });
  
    describe('adjustPoints', () => {
      it('should adjust points with admin adjustment source', async () => {
        const userId = 'user123';
        const amount = 150;
        const reason = 'bonus points';
  
        await pointsService.adjustPoints(userId, amount, reason);
  
        expect(pointsRepository.updatePoints).toHaveBeenCalledWith(
          userId,
          amount,
          'ADMIN_ADJUSTMENT'
        );
      });
    });
  
    describe('resetPoints', () => {
      it('should reset points and emit reset event', async () => {
        const userId = 'user123';
        let emittedEvent: any;
        
        eventEmitter.on('points:reset', (data) => {
          emittedEvent = data;
        });
  
        await pointsService.resetPoints(userId);
  
        expect(pointsRepository.resetPoints).toHaveBeenCalledWith(userId);
        expect(emittedEvent).toEqual({ userId });
      });
    });
  });

  describe('awardTaskPoints', () => {
    it('should award correct points based on task difficulty', async () => {
      const userId = 'user123';
      const difficulty = 'hard';

      await pointsService.awardTaskPoints(userId, difficulty);

      expect(pointsRepository.updatePoints).toHaveBeenCalledWith(
        userId,
        30, // Hard task reward
        'TASK_COMPLETION'
      );
    });
  });

  describe('awardAchievementPoints', () => {
    it('should award achievement points when achievement exists', async () => {
      const userId = 'user123';
      const achievementId = 'achievement123';

      achievementService.getAchievement.mockResolvedValue({
        _id: achievementId,
        rewards: { points: 50 }
      } as any);

      await pointsService.awardAchievementPoints(userId, achievementId);

      expect(pointsRepository.updatePoints).toHaveBeenCalledWith(
        userId,
        50,
        'ACHIEVEMENT_UNLOCK'
      );
    });

    it('should not award points when achievement does not exist', async () => {
      const userId = 'user123';
      const achievementId = 'nonexistent';

      achievementService.getAchievement.mockResolvedValue(null);

      await pointsService.awardAchievementPoints(userId, achievementId);

      expect(pointsRepository.updatePoints).not.toHaveBeenCalled();
    });
  });

  describe('getLeaderboard', () => {
    it('should return top users with points', async () => {
      const mockUsers = [
        { userId: 'user1', username: 'User One', points: 1000 },
        { userId: 'user2', username: 'User Two', points: 500 }
      ];

      pointsRepository.getTopUsers.mockResolvedValue(mockUsers);

      const result = await pointsService.getLeaderboard(2);

      expect(result).toEqual(mockUsers);
      expect(pointsRepository.getTopUsers).toHaveBeenCalledWith(2);
    });
  });
});
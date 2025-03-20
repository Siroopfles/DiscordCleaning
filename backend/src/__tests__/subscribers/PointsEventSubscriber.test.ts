import { EventEmitter } from 'events';
import { Types } from 'mongoose';
import { PointsEventSubscriber } from '../../subscribers/PointsEventSubscriber';
import { AchievementService } from '../../services/AchievementService';
import { PointsService } from '../../services/PointsService';
import { IAchievement } from '../../models/Achievement';

interface MockAchievement extends Partial<IAchievement> {
  _id: Types.ObjectId;
  requirements: {
    type: string;
    target: number;
  };
}

describe('PointsEventSubscriber', () => {
  let eventEmitter: EventEmitter;
  let achievementService: jest.Mocked<AchievementService>;
  let pointsService: jest.Mocked<PointsService>;
  let subscriber: PointsEventSubscriber;

  beforeEach(() => {
    eventEmitter = new EventEmitter();
    achievementService = {
      getAchievementsByRequirementType: jest.fn(),
      resetProgressByType: jest.fn(),
      progressAchievement: jest.fn()
    } as any;
    pointsService = {} as any;

    subscriber = new PointsEventSubscriber(
      eventEmitter,
      achievementService,
      pointsService
    );
  });

  describe('points:updated event', () => {
    it('should check points achievements when points are updated', async () => {
      const mockAchievement: MockAchievement = {
        _id: new Types.ObjectId(),
        name: 'Points Master',
        requirements: {
          type: 'POINTS_EARNED',
          target: 100
        }
      };

      achievementService.getAchievementsByRequirementType
        .mockResolvedValue([mockAchievement] as any);

      await eventEmitter.emit('points:updated', {
        userId: 'user123',
        amount: 50,
        newTotal: 150,
        source: 'TASK_COMPLETION'
      });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(achievementService.getAchievementsByRequirementType)
        .toHaveBeenCalledWith('POINTS_EARNED');
      expect(achievementService.progressAchievement)
        .toHaveBeenCalledWith('user123', mockAchievement._id.toString());
    });

    it('should check streak achievements for task completions', async () => {
      const mockAchievement: MockAchievement = {
        _id: new Types.ObjectId(),
        name: 'Streak Master',
        category: 'medium',
        type: 'STREAK',
        requirements: {
          type: 'STREAK_LENGTH',
          target: 3
        }
      };

      achievementService.getAchievementsByRequirementType
        .mockResolvedValue([mockAchievement] as any);

      await eventEmitter.emit('points:updated', {
        userId: 'user123',
        amount: 20,
        newTotal: 100,
        source: 'TASK_COMPLETION',
        metadata: { difficulty: 'medium' }
      });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(achievementService.getAchievementsByRequirementType)
        .toHaveBeenCalledWith('STREAK_LENGTH');
      expect(achievementService.progressAchievement)
        .toHaveBeenCalledWith('user123', mockAchievement._id.toString());
    });
  });

  describe('points:reset event', () => {
    it('should reset points-based achievements when points are reset', async () => {
      await eventEmitter.emit('points:reset', {
        userId: 'user123'
      });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(achievementService.resetProgressByType)
        .toHaveBeenCalledWith('user123', 'POINTS_EARNED');
    });
  });

  describe('achievement filtering', () => {
    it('should only process relevant achievements based on difficulty', async () => {
      const mockAchievements: MockAchievement[] = [
        {
          _id: new Types.ObjectId(),
          name: 'Easy Streak',
          category: 'easy',
          type: 'STREAK',
          requirements: {
            type: 'STREAK_LENGTH',
            target: 3
          }
        },
        {
          _id: new Types.ObjectId(),
          name: 'Medium Streak',
          category: 'medium',
          type: 'STREAK',
          requirements: {
            type: 'STREAK_LENGTH',
            target: 5
          }
        }
      ];

      achievementService.getAchievementsByRequirementType
        .mockResolvedValue(mockAchievements as any);

      await eventEmitter.emit('points:updated', {
        userId: 'user123',
        amount: 20,
        newTotal: 100,
        source: 'TASK_COMPLETION',
        metadata: { difficulty: 'medium' }
      });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(achievementService.progressAchievement)
        .toHaveBeenCalledTimes(1);
      expect(achievementService.progressAchievement)
        .toHaveBeenCalledWith('user123', mockAchievements[1]._id.toString());
    });
  });
});
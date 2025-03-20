import { Types } from 'mongoose';
import { AchievementService } from '../../services/AchievementService';
import { AchievementRepository } from '../../repositories/AchievementRepository';
import { AchievementProgressRepository } from '../../repositories/AchievementProgressRepository';
import { IAchievement } from '../../models/Achievement';
import { IAchievementProgress } from '../../models/AchievementProgress';
import { AchievementEvent, AchievementEventType } from '../../types/achievement';

// Mock repositories
jest.mock('../../repositories/AchievementRepository');
jest.mock('../../repositories/AchievementProgressRepository');

describe('AchievementService', () => {
  let achievementService: AchievementService;
  let achievementRepo: jest.Mocked<AchievementRepository>;
  let progressRepo: jest.Mocked<AchievementProgressRepository>;

  const mockId = new Types.ObjectId();
  const createMockDocument = <T>(data: Partial<T>): T => {
    return {
      ...data,
      $assertPopulated: jest.fn(),
      $clearModifiedPaths: jest.fn(),
      $clone: jest.fn(),
      $createModifiedPathsSnapshot: jest.fn(),
      $getAllSubdocs: jest.fn(),
      $getPopulatedDocs: jest.fn(),
      $ignore: jest.fn(),
      $isDefaultpopulated: jest.fn(),
      $isDeleted: jest.fn(),
      $isEmpty: jest.fn(),
      $isModified: jest.fn(),
      $isSelected: jest.fn(),
      $isValid: jest.fn(),
      $markValid: jest.fn(),
      $model: jest.fn(),
      $op: null,
      $parent: jest.fn(),
      $session: jest.fn(),
      $set: jest.fn(),
      $toObject: jest.fn(),
      $assertPopulatedInVersion: jest.fn(),
      collection: {},
      db: {},
      delete: jest.fn(),
      deleteOne: jest.fn(),
      depopulate: jest.fn(),
      directModifiedPaths: jest.fn(),
      equals: jest.fn(),
      get: jest.fn(),
      getChanges: jest.fn(),
      increment: jest.fn(),
      init: jest.fn(),
      invalidate: jest.fn(),
      isDirectModified: jest.fn(),
      isDirectSelected: jest.fn(),
      isInit: jest.fn(),
      isNew: false,
      isSelected: jest.fn(),
      markModified: jest.fn(),
      modifiedPaths: jest.fn(),
      modelName: '',
      overwrite: jest.fn(),
      populate: jest.fn(),
      populated: jest.fn(),
      remove: jest.fn(),
      replaceOne: jest.fn(),
      save: jest.fn(),
      schema: {},
      set: jest.fn(),
      toJSON: jest.fn(),
      toObject: jest.fn(),
      unmarkModified: jest.fn(),
      update: jest.fn(),
      updateOne: jest.fn(),
      validate: jest.fn(),
      validateSync: jest.fn()
    } as T;
  };

  const mockAchievement = createMockDocument<IAchievement>({
    _id: mockId,
    name: 'Test Achievement',
    description: 'Test Description',
    category: 'TASKS',
    type: 'ONE_TIME',
    requirements: {
      type: 'TASK_COUNT',
      target: 5
    },
    rewards: {
      points: 100
    },
    isHidden: false,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const mockProgress = createMockDocument<IAchievementProgress>({
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    achievementId: mockId,
    progress: 0,
    isCompleted: false,
    currentStreak: 0,
    maxStreak: 0,
    lastUpdated: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  });

  beforeEach(() => {
    achievementRepo = new AchievementRepository() as jest.Mocked<AchievementRepository>;
    progressRepo = new AchievementProgressRepository() as jest.Mocked<AchievementProgressRepository>;
    achievementService = new AchievementService(achievementRepo, progressRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CRUD operations', () => {
    it('should create an achievement', async () => {
      achievementRepo.create.mockResolvedValue(mockAchievement);
      
      const result = await achievementService.createAchievement(mockAchievement);
      
      expect(result).toEqual(mockAchievement);
      expect(achievementRepo.create).toHaveBeenCalledWith(mockAchievement);
    });

    it('should get an achievement by id', async () => {
      achievementRepo.findById.mockResolvedValue(mockAchievement);
      const result = await achievementService.getAchievement(mockId.toString());
      
      expect(result).toEqual(mockAchievement);
      expect(achievementRepo.findById).toHaveBeenCalledWith(mockId.toString());
    });

    it('should get all achievements', async () => {
      achievementRepo.findAll.mockResolvedValue([mockAchievement]);
      const result = await achievementService.getAllAchievements();
      
      expect(result).toEqual([mockAchievement]);
      expect(achievementRepo.findAll).toHaveBeenCalled();
    });

    it('should get achievements by category', async () => {
      achievementRepo.findByCategory.mockResolvedValue([mockAchievement]);
      const result = await achievementService.getAchievementsByCategory('TASKS');
      
      expect(result).toEqual([mockAchievement]);
      expect(achievementRepo.findByCategory).toHaveBeenCalledWith('TASKS');
    });

    it('should update an achievement', async () => {
      const updateData = { name: 'Updated Achievement' };
      achievementRepo.update.mockResolvedValue(
        createMockDocument<IAchievement>({
          ...mockAchievement,
          ...updateData
        })
      );
      
      const result = await achievementService.updateAchievement(mockId.toString(), updateData);
      
      expect(result).toEqual({ ...mockAchievement, ...updateData });
      expect(achievementRepo.update).toHaveBeenCalledWith(mockId.toString(), updateData);
    });

    it('should delete an achievement', async () => {
      achievementRepo.delete.mockResolvedValue(true);
      const result = await achievementService.deleteAchievement(mockId.toString());
      
      expect(result).toBe(true);
      expect(achievementRepo.delete).toHaveBeenCalledWith(mockId.toString());
    });
  });

  describe('Progress tracking', () => {
    const userId = new Types.ObjectId().toString();

    it('should update progress for ONE_TIME achievement', async () => {
      const oneTimeAchievement = createMockDocument<IAchievement>({
        ...mockAchievement,
        type: 'ONE_TIME'
      });
      
      achievementRepo.findByRequirementType.mockResolvedValue([oneTimeAchievement]);
      progressRepo.findByUserAndAchievement.mockResolvedValue(mockProgress);
      progressRepo.markAsCompleted.mockResolvedValue(
        createMockDocument<IAchievementProgress>({
          ...mockProgress,
          isCompleted: true
        })
      );

      await achievementService.updateProgress({
        userId,
        type: 'TASK_COUNT',
        value: 5
      });

      expect(progressRepo.markAsCompleted).toHaveBeenCalledWith(userId, mockId.toString());
    });

    it('should update progress for PROGRESSIVE achievement', async () => {
      const progressiveAchievement = createMockDocument<IAchievement>({
        ...mockAchievement,
        type: 'PROGRESSIVE'
      });
      
      achievementRepo.findByRequirementType.mockResolvedValue([progressiveAchievement]);
      progressRepo.findByUserAndAchievement.mockResolvedValue(mockProgress);
      progressRepo.updateProgress.mockResolvedValue(
        createMockDocument<IAchievementProgress>({
          ...mockProgress,
          progress: 3
        })
      );

      await achievementService.updateProgress({
        userId,
        type: 'TASK_COUNT',
        value: 3
      });

      expect(progressRepo.updateProgress).toHaveBeenCalledWith(userId, mockId.toString(), 3);
      expect(progressRepo.markAsCompleted).not.toHaveBeenCalled();
    });

    it('should update streak for STREAK achievement', async () => {
      const streakAchievement = createMockDocument<IAchievement>({
        ...mockAchievement,
        type: 'STREAK'
      });
      
      achievementRepo.findByRequirementType.mockResolvedValue([streakAchievement]);
      progressRepo.findByUserAndAchievement.mockResolvedValue(mockProgress);
      progressRepo.updateStreak.mockResolvedValue(
        createMockDocument<IAchievementProgress>({
          ...mockProgress,
          currentStreak: 1,
          maxStreak: 1
        })
      );

      await achievementService.updateProgress({
        userId,
        type: 'STREAK_UPDATED',
        value: 1
      });

      expect(progressRepo.updateStreak).toHaveBeenCalledWith(userId, mockId.toString(), false);
    });

    it('should reset streak when negative value provided', async () => {
      const streakAchievement = createMockDocument<IAchievement>({
        ...mockAchievement,
        type: 'STREAK'
      });
      
      achievementRepo.findByRequirementType.mockResolvedValue([streakAchievement]);
      progressRepo.findByUserAndAchievement.mockResolvedValue(mockProgress);

      await achievementService.updateProgress({
        userId,
        type: 'STREAK_UPDATED',
        value: -1
      });

      expect(progressRepo.updateStreak).toHaveBeenCalledWith(userId, mockId.toString(), true);
    });

    it('should not complete achievement if target not reached', async () => {
      achievementRepo.findByRequirementType.mockResolvedValue([mockAchievement]);
      progressRepo.findByUserAndAchievement.mockResolvedValue(mockProgress);

      await achievementService.updateProgress({
        userId,
        type: 'TASK_COUNT',
        value: 3
      });

      expect(progressRepo.markAsCompleted).not.toHaveBeenCalled();
    });

    it('should get user progress', async () => {
      progressRepo.findAllByUser.mockResolvedValue([mockProgress]);
      const result = await achievementService.getUserProgress(userId);
      
      expect(result).toEqual([mockProgress]);
      expect(progressRepo.findAllByUser).toHaveBeenCalledWith(userId);
    });

    it('should check achievement completion', async () => {
      progressRepo.findByUserAndAchievement.mockResolvedValue(
        createMockDocument<IAchievementProgress>({
          ...mockProgress,
          isCompleted: true
        })
      );

      const result = await achievementService.checkAchievementCompletion(userId, mockId.toString());
      
      expect(result).toBe(true);
      expect(progressRepo.findByUserAndAchievement).toHaveBeenCalledWith(userId, mockId.toString());
    });
  });

  describe('Event handling', () => {
    it('should handle achievement events', async () => {
      const userId = new Types.ObjectId();
      const event: AchievementEvent = {
        type: AchievementEventType.TASK_COMPLETED,
        userId,
        data: {
          value: 1
        }
      };

      achievementRepo.findByRequirementType.mockResolvedValue([mockAchievement]);
      progressRepo.findByUserAndAchievement.mockResolvedValue(mockProgress);

      await achievementService.handleAchievementEvent(event);

      expect(achievementRepo.findByRequirementType).toHaveBeenCalledWith(event.type);
    });
  });
});
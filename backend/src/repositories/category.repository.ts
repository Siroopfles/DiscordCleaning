import { BaseRepository, IBaseRepository } from './base.repository';
import { Category, CategoryDocument } from '../models/Category';
import { Task } from '../models/Task';

export interface ICategoryRepository extends IBaseRepository<CategoryDocument> {
  findByUser(userId: string): Promise<CategoryDocument[]>;
  findWithTaskCount(userId: string): Promise<Array<CategoryDocument & { taskCount: number }>>;
  deleteWithTasks(categoryId: string): Promise<boolean>;
}

export class CategoryRepository extends BaseRepository<CategoryDocument> implements ICategoryRepository {
  constructor() {
    super(Category);
  }

  async findByUser(userId: string): Promise<CategoryDocument[]> {
    return await this.find({ created_by: userId });
  }

  async findWithTaskCount(userId: string): Promise<Array<CategoryDocument & { taskCount: number }>> {
    const categories = await this.model.aggregate([
      {
        $match: { created_by: userId }
      },
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'category',
          as: 'tasks'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          color: 1,
          created_by: 1,
          created_at: 1,
          updated_at: 1,
          taskCount: { $size: '$tasks' }
        }
      }
    ]).exec();

    return categories as Array<CategoryDocument & { taskCount: number }>;
  }

  async deleteWithTasks(categoryId: string): Promise<boolean> {
    const session = await this.model.startSession();
    session.startTransaction();

    try {
      // Delete the category
      const deletedCategory = await this.model.findByIdAndDelete(categoryId).session(session);
      if (!deletedCategory) {
        await session.abortTransaction();
        return false;
      }

      // Delete all tasks in this category
      await Task.deleteMany({ category: categoryId }).session(session);

      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

// Create singleton instance
export const categoryRepository = new CategoryRepository();
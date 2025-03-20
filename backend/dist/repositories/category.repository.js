"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryRepository = exports.CategoryRepository = void 0;
const base_repository_1 = require("./base.repository");
const Category_1 = require("../models/Category");
const Task_1 = require("../models/Task");
class CategoryRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(Category_1.Category);
    }
    async findByUser(userId) {
        return await this.find({ created_by: userId });
    }
    async findWithTaskCount(userId) {
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
        return categories;
    }
    async deleteWithTasks(categoryId) {
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
            await Task_1.Task.deleteMany({ category: categoryId }).session(session);
            await session.commitTransaction();
            return true;
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
}
exports.CategoryRepository = CategoryRepository;
// Create singleton instance
exports.categoryRepository = new CategoryRepository();
//# sourceMappingURL=category.repository.js.map
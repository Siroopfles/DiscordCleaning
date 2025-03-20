"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
class BaseRepository {
    constructor(model) {
        this.model = model;
    }
    async create(data) {
        const entity = new this.model(data);
        return await entity.save();
    }
    async findById(id) {
        return await this.model.findById(id).exec();
    }
    async findOne(filter) {
        return await this.model.findOne(filter).exec();
    }
    async find(filter, options) {
        return await this.model.find(filter, null, options).exec();
    }
    async update(id, data) {
        return await this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
    }
    async delete(id) {
        const result = await this.model.findByIdAndDelete(id).exec();
        return result !== null;
    }
    async exists(filter) {
        const count = await this.model.countDocuments(filter).exec();
        return count > 0;
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=base.repository.js.map
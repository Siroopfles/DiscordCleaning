"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
const base_repository_1 = require("./base.repository");
const User_1 = require("../models/User");
class UserRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(User_1.User);
    }
    async findByDiscordId(discordId) {
        return await this.findOne({ discord_id: discordId });
    }
    async updateSettings(discordId, settings) {
        return await this.model.findOneAndUpdate({ discord_id: discordId }, { $set: { 'settings': Object.assign({}, settings) } }, { new: true, runValidators: true }).exec();
    }
}
exports.UserRepository = UserRepository;
// Create singleton instance
exports.userRepository = new UserRepository();
//# sourceMappingURL=user.repository.js.map
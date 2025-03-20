"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverRepository = exports.ServerRepository = void 0;
const base_repository_1 = require("./base.repository");
const Server_1 = require("../models/Server");
class ServerRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(Server_1.Server);
    }
    async findByDiscordId(discordServerId) {
        return await this.findOne({ discord_server_id: discordServerId });
    }
    async updateSettings(discordServerId, settings) {
        return await this.model.findOneAndUpdate({ discord_server_id: discordServerId }, {
            $set: {
                'settings': Object.assign(Object.assign({}, settings), { updated_at: new Date() })
            }
        }, { new: true, runValidators: true }).exec();
    }
    async findByNotificationChannel(channelId) {
        return await this.findOne({
            'settings.notification_channel': channelId
        });
    }
    async findByLanguage(language) {
        return await this.find({
            'settings.language': language
        });
    }
}
exports.ServerRepository = ServerRepository;
// Create singleton instance
exports.serverRepository = new ServerRepository();
//# sourceMappingURL=server.repository.js.map
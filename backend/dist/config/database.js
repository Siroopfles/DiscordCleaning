"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/huishoudelijk-taken';
async function connectDatabase() {
    try {
        mongoose_1.default.set('strictQuery', true);
        await mongoose_1.default.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ Successfully connected to MongoDB.');
        mongoose_1.default.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected successfully.');
        });
        process.on('SIGINT', async () => {
            try {
                await mongoose_1.default.connection.close();
                console.log('✅ MongoDB connection closed through app termination');
                process.exit(0);
            }
            catch (err) {
                console.error('❌ Error closing MongoDB connection:', err);
                process.exit(1);
            }
        });
    }
    catch (err) {
        console.error('❌ Failed to connect to MongoDB:', err);
        process.exit(1);
    }
}
exports.default = mongoose_1.default;
//# sourceMappingURL=database.js.map
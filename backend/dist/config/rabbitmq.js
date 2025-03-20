"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const amqplib_1 = __importDefault(require("amqplib"));
class RabbitMQConfig {
    constructor() {
        this.connection = null;
        this.channel = null;
        // Exchange en queue namen
        this.NOTIFICATION_EXCHANGE = 'notification.exchange';
        this.TASK_NOTIFICATION_QUEUE = 'task.notifications';
        this.DISCORD_NOTIFICATION_QUEUE = 'discord.notifications';
    }
    async initialize() {
        try {
            // Verbinding maken met RabbitMQ
            this.connection = await amqplib_1.default.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
            this.channel = await this.connection.createChannel();
            // Exchange setup
            await this.channel.assertExchange(this.NOTIFICATION_EXCHANGE, 'topic', { durable: true });
            // Queues setup
            await this.channel.assertQueue(this.TASK_NOTIFICATION_QUEUE, { durable: true });
            await this.channel.assertQueue(this.DISCORD_NOTIFICATION_QUEUE, { durable: true });
            // Bindings
            await this.channel.bindQueue(this.TASK_NOTIFICATION_QUEUE, this.NOTIFICATION_EXCHANGE, 'task.*');
            await this.channel.bindQueue(this.DISCORD_NOTIFICATION_QUEUE, this.NOTIFICATION_EXCHANGE, 'discord.*');
            console.log('🚀 RabbitMQ configuratie succesvol');
        }
        catch (error) {
            console.error('RabbitMQ configuratie fout:', error);
            throw error;
        }
    }
    async publishNotification(routingKey, message) {
        if (!this.channel) {
            throw new Error('RabbitMQ kanaal niet geïnitialiseerd');
        }
        try {
            await this.channel.publish(this.NOTIFICATION_EXCHANGE, routingKey, Buffer.from(JSON.stringify(message)), { persistent: true });
        }
        catch (error) {
            console.error('Fout bij publiceren notificatie:', error);
            throw error;
        }
    }
    async closeConnection() {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
        }
        catch (error) {
            console.error('Fout bij sluiten RabbitMQ verbinding:', error);
            throw error;
        }
    }
    getChannel() {
        if (!this.channel) {
            throw new Error('RabbitMQ kanaal niet geïnitialiseerd');
        }
        return this.channel;
    }
}
exports.default = new RabbitMQConfig();
//# sourceMappingURL=rabbitmq.js.map
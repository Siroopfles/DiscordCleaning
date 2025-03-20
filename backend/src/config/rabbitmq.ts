import amqp, { Connection, Channel } from 'amqplib';

class RabbitMQConfig {
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  // Exchange en queue namen
  private readonly NOTIFICATION_EXCHANGE = 'notification.exchange';
  private readonly TASK_NOTIFICATION_QUEUE = 'task.notifications';
  private readonly DISCORD_NOTIFICATION_QUEUE = 'discord.notifications';

  async initialize(): Promise<void> {
    try {
      // Verbinding maken met RabbitMQ
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
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
    } catch (error) {
      console.error('RabbitMQ configuratie fout:', error);
      throw error;
    }
  }

  async publishNotification(routingKey: string, message: any): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ kanaal niet geïnitialiseerd');
    }

    try {
      await this.channel.publish(
        this.NOTIFICATION_EXCHANGE,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
    } catch (error) {
      console.error('Fout bij publiceren notificatie:', error);
      throw error;
    }
  }

  async closeConnection(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch (error) {
      console.error('Fout bij sluiten RabbitMQ verbinding:', error);
      throw error;
    }
  }

  getChannel(): Channel {
    if (!this.channel) {
      throw new Error('RabbitMQ kanaal niet geïnitialiseerd');
    }
    return this.channel;
  }
}

export default new RabbitMQConfig();
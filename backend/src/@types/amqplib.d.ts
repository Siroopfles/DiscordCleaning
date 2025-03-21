declare module 'amqplib' {
  import { EventEmitter } from 'events';

  export interface Options {
    AssertQueue: {
      durable?: boolean;
      deadLetterExchange?: string;
      deadLetterRoutingKey?: string;
      messageTtl?: number;
    };
    AssertExchange: {
      durable?: boolean;
    };
    Publish: {
      persistent?: boolean;
      contentType?: string;
    };
    Consume: {
      noAck?: boolean;
    };
  }

  export interface ConsumeMessage {
    content: Buffer;
    fields: Record<string, any>;
    properties: Record<string, any>;
  }

  export interface Channel {
    assertQueue(queue: string, options?: Options.AssertQueue): Promise<{ queue: string; messageCount: number }>;
    assertExchange(exchange: string, type: string, options?: Options.AssertExchange): Promise<{ exchange: string }>;
    bindQueue(queue: string, source: string, pattern: string, args?: any): Promise<void>;
    sendToQueue(queue: string, content: Buffer, options?: Options.Publish): boolean;
    consume(queue: string, onMessage: (msg: ConsumeMessage | null) => void, options?: Options.Consume): Promise<{ consumerTag: string }>;
    ack(message: ConsumeMessage, allUpTo?: boolean): void;
    reject(message: ConsumeMessage, requeue?: boolean): void;
    close(): Promise<void>;
  }

  export interface Connection extends EventEmitter {
    createChannel(): Promise<Channel>;
    close(): Promise<void>;
  }

  export function connect(url: string): Promise<Connection>;
}
declare module 'redis' {
  export interface RedisClientType {
    connect(): Promise<void>;
    quit(): Promise<void>;
    on(event: string, listener: (err: Error) => void): this;
    incr(key: string): Promise<number>;
    pExpire(key: string, milliseconds: number): Promise<boolean>;
    multi(): Pipeline;
  }

  export interface Pipeline {
    exec(): Promise<Array<any>>;
  }

  export interface RedisClientOptions {
    url?: string;
  }

  export function createClient(options?: RedisClientOptions): RedisClientType;
}
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { socketAuth, handleSocketError } from '../middleware/socketAuth';
import { connectionManager } from './ConnectionManager';
import { AuthenticatedSocket, WebSocketEvents } from '../types/socket';
import { websocketConfig } from '../config/websocket';

export class WebSocketService {
  private io: Server;

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, websocketConfig);

    this.initialize();
  }

  private initialize(): void {
    // Add authentication middleware
    this.io.use(socketAuth);

    // Handle connections
    this.io.on('connection', (socket: Socket) => {
      const authSocket = socket as AuthenticatedSocket;
      
      try {
        // Add to connection manager
        connectionManager.addConnection(authSocket);

        // Log connection
        console.log(`Client connected: ${socket.id}, User: ${authSocket.user.sub}`);

        // Setup disconnect handler
        socket.on('disconnect', () => {
          connectionManager.removeConnection(socket.id);
          console.log(`Client disconnected: ${socket.id}`);
        });

        // Setup error handler
        socket.on('error', (error: Error) => {
          handleSocketError(error, socket);
        });

        // Emit successful connection
        socket.emit('connected', { status: 'ok' });

      } catch (error) {
        console.error('Error handling socket connection:', error);
        handleSocketError(error as Error, socket);
      }
    });
  }

  // Utility methods for emitting events
  public broadcastEvent<T extends keyof WebSocketEvents>(
    event: T,
    ...args: Parameters<WebSocketEvents[T]>
  ): void {
    connectionManager.broadcast(event, ...args);
  }

  public emitToUser<T extends keyof WebSocketEvents>(
    userId: string,
    event: T,
    ...args: Parameters<WebSocketEvents[T]>
  ): void {
    connectionManager.emitToUser(userId, event, ...args);
  }

  // Monitoring methods
  public getConnectionsCount(): number {
    return connectionManager.getActiveConnectionsCount();
  }

  public getActiveUsersCount(): number {
    return connectionManager.getActiveUsersCount();
  }
}

// Export factory function for creating WebSocketService instance
export const createWebSocketService = (httpServer: HttpServer): WebSocketService => {
  return new WebSocketService(httpServer);
};
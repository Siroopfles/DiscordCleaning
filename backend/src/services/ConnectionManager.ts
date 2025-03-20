import { AuthenticatedSocket, ConnectionManagerInterface, WebSocketEvents } from '../types/socket';

export class ConnectionManager implements ConnectionManagerInterface {
  private connections: Map<string, AuthenticatedSocket>;
  private userConnections: Map<string, Set<string>>;

  constructor() {
    this.connections = new Map();
    this.userConnections = new Map();
  }

  public addConnection(socket: AuthenticatedSocket): void {
    this.connections.set(socket.id, socket);
    
    // Track user connections
    const userId = socket.user.sub as string;
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(socket.id);
  }

  public removeConnection(socketId: string): void {
    const socket = this.connections.get(socketId);
    if (socket) {
      const userId = socket.user.sub as string;
      const userSockets = this.userConnections.get(userId);
      
      if (userSockets) {
        userSockets.delete(socketId);
        if (userSockets.size === 0) {
          this.userConnections.delete(userId);
        }
      }
      
      this.connections.delete(socketId);
    }
  }

  public getConnection(socketId: string): AuthenticatedSocket | undefined {
    return this.connections.get(socketId);
  }

  public getUserConnections(userId: string): AuthenticatedSocket[] {
    const socketIds = this.userConnections.get(userId);
    if (!socketIds) return [];

    return Array.from(socketIds)
      .map(id => this.connections.get(id))
      .filter((socket): socket is AuthenticatedSocket => socket !== undefined);
  }

  public broadcast(event: keyof WebSocketEvents, ...args: any[]): void {
    this.connections.forEach(socket => {
      socket.emit(event, ...args);
    });
  }

  public emitToUser(userId: string, event: keyof WebSocketEvents, ...args: any[]): void {
    const userSockets = this.getUserConnections(userId);
    userSockets.forEach(socket => {
      socket.emit(event, ...args);
    });
  }

  // Helper methods for monitoring and debugging
  public getActiveConnectionsCount(): number {
    return this.connections.size;
  }

  public getActiveUsersCount(): number {
    return this.userConnections.size;
  }
}

// Create and export singleton instance
export const connectionManager = new ConnectionManager();
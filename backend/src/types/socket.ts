import { Socket } from 'socket.io';
import { JwtPayload } from 'jsonwebtoken';

export interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
}

export interface WebSocketEvents {
  // Connection events
  connect: () => void;
  disconnect: () => void;
  error: (error: string) => void;
  connected: (data: { status: string }) => void;

  // Task events
  'task:update': (taskId: string, data: any) => void;
  'task:create': (data: any) => void;
  'task:delete': (taskId: string) => void;

  // Achievement events
  'achievement:unlock': (achievementId: string, userId: string) => void;
  'achievement:progress': (achievementId: string, userId: string, progress: number) => void;

  // Points events
  'points:update': (userId: string, points: number) => void;
  'leaderboard:update': (data: any) => void;

  // Test events
  'test:event': (data: { type: string; value: string }) => void;
}

export interface ConnectionManagerInterface {
  addConnection: (socket: AuthenticatedSocket) => void;
  removeConnection: (socketId: string) => void;
  getConnection: (socketId: string) => AuthenticatedSocket | undefined;
  getUserConnections: (userId: string) => AuthenticatedSocket[];
  broadcast: (event: keyof WebSocketEvents, ...args: any[]) => void;
  emitToUser: (userId: string, event: keyof WebSocketEvents, ...args: any[]) => void;
}
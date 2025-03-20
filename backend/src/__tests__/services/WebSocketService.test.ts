import { createServer } from 'http';
import { AddressInfo } from 'net';
import type { Socket } from 'socket.io-client';
import { connect as socketConnect } from 'socket.io-client';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { WebSocketService } from '../../services/WebSocketService';
import { WebSocketEvents } from '../../types/socket';

const JWT_SECRET = 'test-secret';
process.env.JWT_SECRET = JWT_SECRET;

type ConnectedData = { status: string };
type TestEventData = { type: string; value: string };

describe('WebSocketService', () => {
  let httpServer: ReturnType<typeof createServer>;
  let webSocketService: WebSocketService;
  let clientSocket: Socket;
  let port: number;

  beforeAll((done) => {
    httpServer = createServer();
    webSocketService = new WebSocketService(httpServer);
    
    httpServer.listen(() => {
      port = (httpServer.address() as AddressInfo).port;
      done();
    });
  });

  afterAll(() => {
    httpServer.close();
  });

  beforeEach(() => {
    clientSocket = socketConnect(`http://localhost:${port}`);
  });

  afterEach(() => {
    clientSocket.close();
  });

  it('should authenticate valid JWT token', (done) => {
    const token = jwt.sign({ sub: 'test-user-id', role: 'user' }, JWT_SECRET);
    
    const socket = socketConnect(`http://localhost:${port}`, {
      auth: { token }
    });

    socket.on('connected', (data: ConnectedData) => {
      expect(data.status).toBe('ok');
      socket.close();
      done();
    });
  });

  it('should reject invalid JWT token', (done) => {
    const socket = socketConnect(`http://localhost:${port}`, {
      auth: { token: 'invalid-token' }
    });

    socket.on('error', (error: string) => {
      expect(error).toBe('Authentication failed');
      socket.close();
      done();
    });
  });

  it('should track connections correctly', (done) => {
    const token = jwt.sign({ sub: 'test-user-id', role: 'user' }, JWT_SECRET);
    
    const socket = socketConnect(`http://localhost:${port}`, {
      auth: { token }
    });

    socket.on('connected', () => {
      expect(webSocketService.getConnectionsCount()).toBe(1);
      expect(webSocketService.getActiveUsersCount()).toBe(1);
      
      socket.close();
      
      // Wait for disconnect to be processed
      setTimeout(() => {
        expect(webSocketService.getConnectionsCount()).toBe(0);
        expect(webSocketService.getActiveUsersCount()).toBe(0);
        done();
      }, 100);
    });
  });

  it('should broadcast events to authenticated clients', (done) => {
    const token = jwt.sign({ sub: 'test-user-id', role: 'user' }, JWT_SECRET);
    const testData: TestEventData = { type: 'test', value: 'data' };
    
    const socket = socketConnect(`http://localhost:${port}`, {
      auth: { token }
    });

    socket.on('connected', () => {
      socket.on('test:event', (data: TestEventData) => {
        expect(data).toEqual(testData);
        socket.close();
        done();
      });

      webSocketService.broadcastEvent('test:event', testData);
    });
  });

  it('should emit events to specific user', (done) => {
    const userId = 'test-user-id';
    const token = jwt.sign({ sub: userId, role: 'user' }, JWT_SECRET);
    const testData: TestEventData = { type: 'test', value: 'user-specific' };
    
    const socket = socketConnect(`http://localhost:${port}`, {
      auth: { token }
    });

    socket.on('connected', () => {
      socket.on('test:event', (data: TestEventData) => {
        expect(data).toEqual(testData);
        socket.close();
        done();
      });

      webSocketService.emitToUser(userId, 'test:event', testData);
    });
  });

  it('should handle multiple connections from same user', (done) => {
    const userId = 'multi-connection-user';
    const token = jwt.sign({ sub: userId, role: 'user' }, JWT_SECRET);
    const testData: TestEventData = { type: 'test', value: 'multi-connection' };
    let receivedCount = 0;
    
    // Create two sockets for same user
    const socket1 = socketConnect(`http://localhost:${port}`, { auth: { token } });
    const socket2 = socketConnect(`http://localhost:${port}`, { auth: { token } });

    const handleReceived = () => {
      receivedCount++;
      if (receivedCount === 2) {
        socket1.close();
        socket2.close();
        done();
      }
    };

    socket1.on('connected', () => {
      socket1.on('test:event', (data: TestEventData) => {
        expect(data).toEqual(testData);
        handleReceived();
      });
    });

    socket2.on('connected', () => {
      socket2.on('test:event', (data: TestEventData) => {
        expect(data).toEqual(testData);
        handleReceived();
      });

      // Send event after both sockets are connected and listening
      webSocketService.emitToUser(userId, 'test:event', testData);
    });
  });
});
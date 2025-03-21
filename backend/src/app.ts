import express, { Express } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { json } from 'body-parser';
import { createWebSocketService } from './services/WebSocketService';
import { websocketConfig } from './config/websocket';
import webhookRoutes from './routes/webhook.routes';
import { initWebhookMetrics } from './config/webhookMetrics';

// Initialize express app
const app: Express = express();
const httpServer = createServer(app);

// Setup middleware
app.use(cors({
  origin: websocketConfig.cors.origin,
  credentials: true
}));
app.use(json());

// Initialize WebSocket service
const wsService = createWebSocketService(httpServer);

// Initialize webhook metrics
initWebhookMetrics();

// Register routes
app.use('/api/webhooks', webhookRoutes);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    websocket: {
      connections: wsService.getConnectionsCount(),
      activeUsers: wsService.getActiveUsersCount()
    }
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Export for use in server.ts
export { app, httpServer, wsService };
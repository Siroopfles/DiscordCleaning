import 'dotenv/config';
import { app, httpServer, wsService, discordClient } from './app';

const PORT = process.env.PORT || 3001;

// Start HTTP server
const server = httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`👾 WebSocket server initialized`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

// Graceful shutdown
process.on('SIGTERM', () => gracefulShutdown());
process.on('SIGINT', () => gracefulShutdown());

function gracefulShutdown() {
  console.log('🔄 Initiating graceful shutdown...');
  
  // Create a shutdown promise
  const shutdown = Promise.all([
    // Sluit HTTP server
    new Promise<void>((resolve) => {
      server.close(() => {
        console.log('👋 HTTP server closed');
        resolve();
      });
    }),
    // Sluit Discord client
    new Promise<void>((resolve) => {
      if (discordClient) {
        discordClient.destroy();
        console.log('🤖 Discord client destroyed');
      }
      resolve();
    })
  ]);

  // Add timeout to force exit if graceful shutdown takes too long
  const forceExit = new Promise<void>((resolve) => {
    setTimeout(() => {
      console.log('⚠️ Forcing exit after timeout');
      resolve();
    }, 10000); // 10 seconds timeout
  });

  // Execute shutdown
  Promise.race([shutdown, forceExit])
    .then(() => {
      console.log('👍 Shutdown complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error during shutdown:', error);
      process.exit(1);
    });
}

export { server };
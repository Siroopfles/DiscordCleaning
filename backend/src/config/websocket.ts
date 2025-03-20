export const websocketConfig = {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  connectionTimeout: 10000,
  pingTimeout: 5000,
  pingInterval: 10000,
  maxHttpBufferSize: 1e6 // 1 MB
};

export const eventConfig = {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000
};
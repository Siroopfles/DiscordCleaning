import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import taskRoutes from './routes/task.routes';
import notificationRoutes from './routes/notification.routes';
import currencyRoutes from './routes/currency.routes';
import userRoutes from './routes/user.routes';
import notificationService from './services/notification.service';
import { UserSettingsError } from './services/user.service';
import { ApiError } from './utils/ApiError';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/household-tasks')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  
  if ('statusCode' in err && typeof (err as any).statusCode === 'number') {
    return res.status((err as any).statusCode).json({
      error: err.message
    });
  }

  res.status(500).json({
    error: 'Internal Server Error'
  });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        details: err.details
      }
    });
  }

  if (err instanceof UserSettingsError) {
    return res.status(400).json({
      error: {
        message: err.message,
        type: 'UserSettingsError'
      }
    });
  }

  res.status(500).json({
    error: {
      message: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }
  });
});

const PORT = process.env.PORT || 3000;

// Note: NotificationService wordt geïnitialiseerd in de Discord bot setup
// Het wordt hier alleen gebruikt voor de routes en error handling

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
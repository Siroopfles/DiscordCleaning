import winston from 'winston';
import 'winston-daily-rotate-file';

// Define custom levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const logger = winston.createLogger({
  levels,
  format: logFormat,
  transports: [
    // Console logging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // Roterende log files
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d'
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d'
    })
  ]
});

interface WebhookContext {
  webhookId: string;
  eventType: string;
  deliveryId?: string;
  status?: string;
  retryCount?: number;
  duration?: number;
  error?: string;
}

// Add request context for structured logging
export const addRequestContext = (req: any) => {
  return {
    method: req.method,
    url: req.url,
    userAgent: req.get('user-agent'),
    ip: req.ip,
    correlationId: req.headers['x-correlation-id']
  };
};

// Add webhook context for structured logging
export const addWebhookContext = (data: WebhookContext): WebhookContext & { service: string, timestamp: string } => {
  return {
    ...data,
    service: 'webhook',
    timestamp: new Date().toISOString()
  };
};

export default logger;
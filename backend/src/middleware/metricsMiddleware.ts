import { Request, Response, NextFunction } from 'express';
import { register, calendarApiDuration } from '../config/metrics';
import logger from '../utils/logger';

// Track HTTP request durations
export const trackHTTPMetrics = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Track response
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Track API call duration
    if (req.path.includes('/api/calendar')) {
      calendarApiDuration
        .labels(req.method)
        .observe(duration / 1000); // Convert to seconds
    }
  });

  next();
};

// Metrics endpoint for Prometheus scraping
export const metricsEndpoint = async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error generating metrics:', error);
    res.status(500).end();
  }
};
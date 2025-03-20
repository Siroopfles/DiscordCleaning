import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  next();
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const hasRequiredRole = req.user.roles.some(role => roles.includes(role));
    if (!hasRequiredRole) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
};
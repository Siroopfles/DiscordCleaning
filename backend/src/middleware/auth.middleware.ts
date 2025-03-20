import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';

export interface AuthenticatedRequest extends Request {
  user?: any;
  discordId?: string;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const discordId = req.headers['x-discord-id'];

    if (!discordId || typeof discordId !== 'string') {
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Missing or invalid Discord ID' 
      });
    }

    const user = await userService.findByDiscordId(discordId);
    if (!user) {
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'User not found' 
      });
    }

    req.user = user;
    req.discordId = discordId;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      message: 'Internal server error during authentication'
    });
  }
};
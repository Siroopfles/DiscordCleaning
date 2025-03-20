import { Request } from 'express';

declare global {
  namespace Express {
    interface User {
      userId: string;
      username: string;
      roles: string[];
    }

    interface Request {
      user?: User;
    }
  }
}
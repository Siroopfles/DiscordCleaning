import { Socket } from 'socket.io';
import { verify, JwtPayload } from 'jsonwebtoken';
import { ExtendedError } from 'socket.io/dist/namespace';
import { AuthenticatedSocket } from '../types/socket';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const socketAuth = (
  socket: Socket,
  next: (err?: ExtendedError | undefined) => void
) => {
  const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];

  if (!token) {
    const err = new Error('Authentication token missing');
    err.name = 'UnauthorizedError';
    return next(err);
  }

  try {
    // Remove 'Bearer ' if present
    const jwtToken = token.replace('Bearer ', '');
    const decoded = verify(jwtToken, JWT_SECRET);

    // Verify decoded token is a JwtPayload
    if (typeof decoded === 'string') {
      throw new Error('Invalid token format');
    }

    // Add user data to socket
    (socket as AuthenticatedSocket).user = decoded;

    next();
  } catch (error) {
    const err = new Error('Invalid authentication token');
    err.name = 'UnauthorizedError';
    next(err);
  }
};

export const handleSocketError = (error: Error, socket: Socket) => {
  if (error.name === 'UnauthorizedError') {
    socket.emit('error', 'Authentication failed');
    socket.disconnect(true);
  }
};
import { Socket } from 'socket.io';
import type { RequestHandler } from 'express';

/**
 * Socket.IO Authentication Middleware
 *
 * Authenticates WebSocket connections using existing express-session.
 * Reuses HTTP session cookies - no separate WebSocket authentication needed.
 *
 * Usage:
 * io.use((socket, next) => socketAuthMiddleware(socket, next, sessionMiddleware));
 */
export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void,
  sessionMiddleware: RequestHandler
) => {
  // Use express-session middleware to parse session from cookie
  sessionMiddleware(socket.request as any, {} as any, () => {
    const session = (socket.request as any).session;

    if (!session?.userId || !session?.organizationId) {
      return next(new Error('Unauthorized: No valid session'));
    }

    // Store user context in socket for use in handlers
    socket.data.userId = session.userId;
    socket.data.organizationId = session.organizationId;

    next();
  });
};

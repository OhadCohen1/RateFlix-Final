import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { ApiError } from './errorHandler.ts';

export type UserRole = 'user' | 'admin';

export interface AuthUser {
  id: string;
  role: UserRole;
}

interface TokenPayload extends JwtPayload {
  id: string;
  role: UserRole;
}

// Make the authenticated user available as req.user everywhere, fully typed
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Verifies the JWT from the Authorization header and attaches { id, role } to req.user
export const protect: RequestHandler = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Not authorized, no token provided');
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new ApiError(500, 'JWT_SECRET is not configured on the server');
  }

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    req.user = { id: decoded.id, role: decoded.role };
  } catch {
    throw new ApiError(401, 'Not authorized, token is invalid or expired');
  }

  next();
};

// Restricts a route to specific roles, e.g. authorize('admin')
export const authorize = (...roles: UserRole[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, 'Forbidden: insufficient permissions');
    }
    next();
  };
};

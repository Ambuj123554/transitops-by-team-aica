import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendUnauthorized, sendForbidden } from '../utils/apiResponse';

/**
 * JWT secret key. In production, set JWT_SECRET via environment variable.
 * @default 'transitops-jwt-secret-change-in-production'
 */
const JWT_SECRET = process.env.JWT_SECRET || 'transitops-jwt-secret-change-in-production';

/**
 * Authenticated user information extracted from JWT token.
 * Attached to `req.user` after successful token verification.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      /** Authenticated user from JWT payload */
      user?: AuthUser;
    }
  }
}

/**
 * Generate a signed JWT token for an authenticated user.
 * Token expires in 24 hours.
 *
 * @param user - User object with id, email, name, and role
 * @returns Signed JWT string
 */
export function generateToken(user: { id: string; email: string; name: string; role: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Middleware that verifies the Bearer token in the Authorization header.
 * On success, attaches the decoded user to `req.user`.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendUnauthorized(res, 'Missing or invalid authorization header');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return sendUnauthorized(res, 'Token has expired. Please sign in again.');
    }
    return sendUnauthorized(res, 'Invalid or expired token');
  }
}

/**
 * Middleware factory that restricts access to specified roles.
 * Must be used after `requireAuth`.
 *
 * @param allowedRoles - One or more role strings allowed to access the route
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * router.patch('/:id', requireRole('FLEET_MANAGER'), controller.update);
 * ```
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendUnauthorized(res);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendForbidden(res, 'Insufficient permissions');
    }

    next();
  };
}

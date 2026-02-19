import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export interface AuthPayload {
  userId: string;
  role: string;
}

/**
 * Middleware to verify JWT Bearer token.
 * Skips authentication for the /health endpoint.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip auth for health check (req.path is relative to mount point)
  if (req.path === '/health') {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Missing or invalid Authorization header. Use: Bearer <token>',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    (req as Request & { user?: AuthPayload }).user = decoded;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
}

/**
 * Generate a JWT token (for the /login endpoint).
 */
export function generateToken(userId: string, role: string = 'viewer'): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '24h' });
}

import { Router, Request, Response } from 'express';
import { generateToken } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/login
 * Simple login endpoint — returns a JWT token.
 * In production, this would validate credentials against a user store.
 */
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Hardcoded demo credentials
  if (username === 'admin' && password === 'password') {
    const token = generateToken('admin-001', 'admin');
    res.json({
      success: true,
      data: {
        token,
        expiresIn: '24h',
      },
    });
    return;
  }

  if (username === 'viewer' && password === 'password') {
    const token = generateToken('viewer-001', 'viewer');
    res.json({
      success: true,
      data: {
        token,
        expiresIn: '24h',
      },
    });
    return;
  }

  res.status(401).json({
    success: false,
    error: 'Invalid credentials',
  });
});

export default router;

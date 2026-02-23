import { Router, Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { rateLimitTiers } from '../middleware/rateLimiter.js';
import { auditMiddleware } from '../middleware/audit.middleware.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

const router = Router();

const isProduction = process.env.NODE_ENV === 'production';

// ==========================================
// AUTH ENDPOINTS (DB Integration)
// ==========================================

router.post('/login', rateLimitTiers.auth, async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid input: email and password are required' });
  }
  const { email, password } = parsed.data;

  try {
    if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEV_LOGIN === 'true') {
      const user = await prisma.user.findUnique({ where: { email } });

      // Allow login if user exists (Dev/Test mode - Passwordless)
      if (user) {
        const accessToken = jwt.sign(
          { sub: user.id, email: user.email, systemRole: (user as any).systemRole ?? 'MEMBER' },
          process.env.JWT_SECRET!,
          { expiresIn: (process.env.JWT_EXPIRE || '15m') as jwt.SignOptions['expiresIn'] },
        );
        const refreshToken = jwt.sign(
          { sub: user.id },
          process.env.JWT_SECRET!,
          { expiresIn: (process.env.JWT_REFRESH_EXPIRE || '7d') as jwt.SignOptions['expiresIn'] },
        );

        res.cookie('access_token', accessToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax',
          maxAge: 15 * 60 * 1000, // 15 minutes
          path: '/',
        });
        res.cookie('refresh_token', refreshToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/api/auth/refresh',
        });

        return res.json({
          success: true,
          data: {
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: (user as any).systemRole || 'MEMBER',
            },
          },
          message: 'Login successful',
        });
      }
    }

    res.status(401).json({
      success: false,
      error: 'Invalid credentials',
    });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Auth failed' });
  }
});

router.post('/register', rateLimitTiers.auth, auditMiddleware('user.register'), async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: email (valid email), name (non-empty)',
    });
  }
  const { email, name } = parsed.data;

  try {
    const newUser = await prisma.user.create({
        data: {
            email,
            // password removed
            name,
            systemRole: 'MEMBER'
        }
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.systemRole, // Map systemRole to role
        },
      },
      message: 'Registration successful',
    });
  } catch (error: unknown) {
     console.error('Registration Error:', error);
     res.status(400).json({ success: false, error: `Registration failed: ${error instanceof Error ? error.message : String(error)}` });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;

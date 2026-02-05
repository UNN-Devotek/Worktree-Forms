import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { rateLimitTiers } from '../middleware/rateLimiter.js';

const router = Router();

// ==========================================
// AUTH ENDPOINTS (DB Integration)
// ==========================================

router.post('/login', rateLimitTiers.auth, async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // For demo simplicity, we still allow the hardcoded admin, 
  // OR check the DB. 
  // Real implementation would use bcrypt to compare passwords.
  
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Allow login if user exists (Dev/Test mode - Passwordless)
    if (user) { 
       return res.json({
        success: true,
        data: {
          token: `mock-jwt-token-for-${user.id}`, // In real app, sign JWT here
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            // role removed from schema, mapping systemRole to role for compatibility
            role: (user as any).systemRole || 'viewer',
          },
        },
        message: 'Login successful',
      });
    }

    // Fallback for the hardcoded admin if not in DB yet (or just rely on seed)
    if (email === 'admin@worktree.pro' && password === 'admin123') {
       return res.json({
        success: true,
        data: {
          token: `demo-token`,
          user: {
            id: '1',
            email: 'admin@worktree.pro',
            name: 'Admin User',
            role: 'admin', // Mapped for frontend compatibility
          },
        },
        message: 'Login successful',
      });
    }

    res.status(401).json({
      success: false,
      error: 'Invalid credentials',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Auth failed' });
  }
});

router.post('/register', rateLimitTiers.auth, async (req: Request, res: Response) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: email, name',
    });
  }

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
  } catch (error) {
     console.error('Registration Error:', error);
     res.status(400).json({ success: false, error: `Registration failed: ${error instanceof Error ? error.message : String(error)}` });
  }
});

export default router;

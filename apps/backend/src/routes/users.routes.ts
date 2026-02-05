import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { ComplianceService } from '../services/compliance.service.js';

const router = Router();

// ==========================================
// USER ENDPOINTS
// ==========================================

router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    // Exclude passwords
    const safeUsers = users.map((u: any) => ({ ...u, password: undefined }));
    res.json({ success: true, data: safeUsers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

router.get('/me', async (req: Request, res: Response) => {
  // Mock 'me' as the admin for now or the first user
  // In real app, extract ID from JWT middleware
  try {
      const admin = await prisma.user.findFirst({ where: { systemRole: 'ADMIN' }});
      if (admin) {
           res.json({
                success: true,
                data: { ...admin, password: undefined }
            });
      } else {
          // Fallback
          res.json({
            success: true,
            data: {
              id: '1',
              email: 'admin@worktree.pro',
              name: 'Admin User',
              role: 'admin',
            },
          });
      }
  } catch (error) {
      res.status(500).json({ success: false, error: 'Error' });
  }
});

router.post('/compliance', async (req: Request, res: Response) => {
    try {
        const { insuranceUrl } = req.body;
        // Mock Auth or Header Auth
        const userId = (req.headers['x-user-id'] as string); 

        if (!userId) {
             return res.status(401).json({ error: "Unauthorized" });
        }

        const result = await ComplianceService.submitInsurance(userId, insuranceUrl);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Compliance Error:', error);
        res.status(500).json({ error: 'Failed to submit compliance' });
    }
});

export default router;

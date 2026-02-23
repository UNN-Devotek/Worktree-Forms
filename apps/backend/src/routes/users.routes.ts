import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { ComplianceService } from '../services/compliance.service.js';
import { parsePaginationParam } from '../utils/query.js';

const router = Router();

// ==========================================
// USER ENDPOINTS
// ==========================================

router.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const requester = await prisma.user.findUnique({ where: { id: userId }, select: { systemRole: true } });
  if (!requester || requester.systemRole !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  try {
    const take = parsePaginationParam(req.query.take, 100, 500);
    const skip = parsePaginationParam(req.query.skip, 0, 100000);
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({ take, skip }),
      prisma.user.count()
    ]);
    const safeUsers = users.map((u: any) => ({ ...u, password: undefined }));
    res.json({ success: true, data: safeUsers, meta: { total, take, skip } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

router.get('/me', async (req: Request, res: Response) => {
  try {
      const userId = (req as any).user.id;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ success: false, error: 'User not found' });
      res.json({ success: true, data: { ...user, password: undefined } });
  } catch (error) {
      res.status(500).json({ success: false, error: 'Error' });
  }
});

router.post('/compliance', async (req: Request, res: Response) => {
    try {
        const { insuranceUrl } = req.body;
        // Mock Auth or Header Auth
        const userId = (req as any).user.id;

        const result = await ComplianceService.submitInsurance(userId, insuranceUrl);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Compliance Error:', error);
        res.status(500).json({ error: 'Failed to submit compliance' });
    }
});

export default router;

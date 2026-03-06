import { Router, Request, Response } from 'express';
import { UserEntity } from '../lib/dynamo/index.js';
import { ComplianceService } from '../services/compliance.service.js';

const router = Router();

// ==========================================
// USER ENDPOINTS
// ==========================================

router.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const userResult = await UserEntity.get({ userId }).go();
  if (!userResult.data || userResult.data.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  try {
    const result = await UserEntity.scan.go();
    const safeUsers = result.data.map((u) => ({ ...u, passwordHash: undefined }));
    res.json({ success: true, data: safeUsers, meta: { total: safeUsers.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

router.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await UserEntity.get({ userId }).go();
    if (!result.data) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: { ...result.data, passwordHash: undefined } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error' });
  }
});

router.post('/compliance', async (req: Request, res: Response) => {
  try {
    const { insuranceUrl, projectId } = req.body;
    const userId = (req as any).user.id;

    const result = await ComplianceService.submitInsurance(userId, projectId || 'global', insuranceUrl);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Compliance Error:', error);
    res.status(500).json({ error: 'Failed to submit compliance' });
  }
});

export default router;

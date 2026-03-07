import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authenticate.js';
import { UserEntity, ProjectMemberEntity } from '../lib/dynamo/index.js';
import { ComplianceService } from '../services/compliance.service.js';

const router = Router();

// ==========================================
// USER ENDPOINTS
// ==========================================

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const userResult = await UserEntity.get({ userId }).go();
    if (!userResult.data || userResult.data.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    const result = await UserEntity.scan.go();
    const safeUsers = result.data.map(({ passwordHash: _pw, ...u }) => u);
    res.json({ success: true, data: safeUsers, meta: { total: safeUsers.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

router.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const result = await UserEntity.get({ userId }).go();
    if (!result.data) return res.status(404).json({ success: false, error: 'User not found' });
    const { passwordHash: _pw, ...safeUser } = result.data;
    res.json({ success: true, data: safeUser });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

router.post('/compliance', async (req: Request, res: Response) => {
  try {
    const { insuranceUrl, projectId } = req.body;
    const userId = (req as AuthenticatedRequest).user.id;

    // When a projectId is supplied, verify the caller is a member of that project
    if (projectId && projectId !== 'global') {
      const membership = await ProjectMemberEntity.query.primary({ projectId, userId }).go();
      if (!membership.data.length) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }
    }

    const result = await ComplianceService.submitInsurance(userId, projectId || 'global', insuranceUrl);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Compliance Error:', error);
    res.status(500).json({ error: 'Failed to submit compliance' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authenticate.js';
import { requireProjectAccess } from '../middleware/rbac.js';
import { ComplianceRecordEntity } from '../lib/dynamo/index.js';
import { nanoid } from 'nanoid';

const router = Router();

// GET /api/projects/:projectId/compliance/status
router.get('/projects/:projectId/compliance/status', requireProjectAccess('VIEWER'), async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;

    // Get compliance records scoped to this project and user via ElectroDB filter
    const result = await ComplianceRecordEntity.query
      .byUser({ userId })
      .where(({ projectId: pid }, { eq }) => eq(pid, projectId))
      .go();
    const records = result.data;

    const pendingRecords = records.filter((r) => r.status === 'PENDING' || !r.status);

    res.json({
      success: true,
      data: {
        compliant: pendingRecords.length === 0 && records.length > 0,
        pendingRequirements: pendingRecords.map((r) => ({
          id: r.recordId,
          type: r.type,
          status: r.status,
        })),
        totalRecords: records.length,
      },
    });
  } catch (error) {
    console.error('Compliance status error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch compliance status' });
  }
});

const COMPLIANCE_TYPES = ['SAFETY_TRAINING', 'BACKGROUND_CHECK', 'CERTIFICATION', 'INSURANCE', 'CONTRACT', 'OTHER'] as const;

const submitSchema = z.object({
  type: z.enum(COMPLIANCE_TYPES),
  fileUrl: z.string().url().optional(),
  textAnswer: z.string().max(5000).optional(),
});

// POST /api/projects/:projectId/compliance/submit
router.post('/projects/:projectId/compliance/submit', requireProjectAccess('EDITOR'), async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;
    const parsed = submitSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'type is required' });
    }

    const { type, fileUrl } = parsed.data;
    const recordId = nanoid();

    const result = await ComplianceRecordEntity.create({
      recordId,
      projectId,
      userId,
      type,
      status: 'PENDING',
      data: { fileUrl },
    }).go();

    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Compliance submit error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit compliance record' });
  }
});

export default router;

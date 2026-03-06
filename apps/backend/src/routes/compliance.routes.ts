import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ComplianceRecordEntity } from '../lib/dynamo/index.js';
import { nanoid } from 'nanoid';

const router = Router();

// GET /api/projects/:projectId/compliance/status
router.get('/projects/:projectId/compliance/status', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;

    // Get all compliance records for this user
    const result = await ComplianceRecordEntity.query.byUser({ userId }).go();
    const records = result.data.filter((r) => r.projectId === projectId);

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

const submitSchema = z.object({
  type: z.string(),
  fileUrl: z.string().optional(),
  textAnswer: z.string().optional(),
});

// POST /api/projects/:projectId/compliance/submit
router.post('/projects/:projectId/compliance/submit', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;
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

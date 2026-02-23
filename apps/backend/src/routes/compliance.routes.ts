import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';

const router = Router();

// GET /api/projects/:projectId/compliance/status
// Returns { compliant: boolean, pendingRequirements: [] }
router.get('/projects/:projectId/compliance/status', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;

    const requirements = await prisma.complianceRequirement.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });

    const records = await prisma.complianceRecord.findMany({
      where: {
        userId,
        requirementId: { in: requirements.map(r => r.id) },
      },
    });

    const recordMap = new Map(records.map(r => [r.requirementId, r]));

    const pendingRequirements = requirements
      .filter(req => {
        const record = recordMap.get(req.id);
        return !record || record.status === 'PENDING';
      })
      .map(req => ({
        id: req.id,
        label: req.label,
        type: req.type,
        required: req.required,
        status: recordMap.get(req.id)?.status ?? 'NOT_STARTED',
      }));

    res.json({
      success: true,
      data: {
        compliant: pendingRequirements.filter(r => r.required).length === 0,
        pendingRequirements,
      },
    });
  } catch (error) {
    console.error('Compliance status error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch compliance status' });
  }
});

const submitSchema = z.object({
  requirementId: z.string(),
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
      return res.status(400).json({ success: false, error: 'requirementId is required' });
    }

    const { requirementId, fileUrl } = parsed.data;

    const record = await prisma.complianceRecord.upsert({
      where: { userId_requirementId: { userId, requirementId } },
      update: {
        fileUrl,
        status: 'PENDING',
        submittedAt: new Date(),
      },
      create: {
        userId,
        requirementId,
        fileUrl,
        status: 'PENDING',
        submittedAt: new Date(),
      },
    });

    res.json({ success: true, data: record });
  } catch (error) {
    console.error('Compliance submit error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit compliance record' });
  }
});

export default router;

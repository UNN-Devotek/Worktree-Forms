import { Router, Request, Response } from 'express';
import {
  UserEntity,
  FormEntity,
  SubmissionEntity,
  ProjectEntity,
} from '../lib/dynamo/index.js';
import { getSecurityMiddleware } from '../middleware/security.js';

const router = Router();

// ==========================================
// DASHBOARD & ADMIN ENDPOINTS
// ==========================================

// Admin Stats
router.get('/admin/stats', async (_req: Request, res: Response) => {
  try {
    const usersResult = await UserEntity.scan.go();
    const formsResult = await FormEntity.scan.go();
    const submissionsResult = await SubmissionEntity.scan.go();

    res.json({
      success: true,
      data: {
        totalUsers: usersResult.data.length,
        activeForms: formsResult.data.filter((f) => f.status !== 'ARCHIVED').length,
        totalSubmissions: submissionsResult.data.length,
        auditLogs: 0,
        lastSync: new Date().toISOString(),
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Stats error' });
  }
});

// Get Project Metrics
router.get('/projects/:id/metrics', getSecurityMiddleware(), async (req: Request, res: Response) => {
  try {
    const { id: projectId } = req.params;

    const projectResult = await ProjectEntity.get({ projectId }).go();
    const project = projectResult.data;

    const formsResult = await FormEntity.query.byProject({ projectId }).go();
    const forms = formsResult.data;

    if (forms.length === 0) {
      return res.json({
        success: true,
        data: {
          totalSubmissions: 0,
          statsByForm: [],
          storageUsage: String(project?.storageUsedBytes ?? 0),
        },
      });
    }

    // Get submissions for each form
    let totalSubmissions = 0;
    const statsByForm: Array<{ formName: string; count: number }> = [];

    for (const form of forms) {
      const subResult = await SubmissionEntity.query.byForm({ formId: form.formId }).go();
      const count = subResult.data.length;
      totalSubmissions += count;
      statsByForm.push({ formName: form.name, count });
    }

    res.json({
      success: true,
      data: {
        totalSubmissions,
        statsByForm,
        storageUsage: String(project?.storageUsedBytes ?? 0),
      },
    });
  } catch (error) {
    console.error('Metrics Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch metrics' });
  }
});

// Get Project Activity Feed
router.get('/projects/:id/activity', getSecurityMiddleware(), async (req: Request, res: Response) => {
  try {
    const { id: projectId } = req.params;

    const formsResult = await FormEntity.query.byProject({ projectId }).go();
    const forms = formsResult.data;

    if (forms.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Gather recent submissions across forms
    const allSubmissions = [];
    for (const form of forms) {
      const subResult = await SubmissionEntity.query.byForm({ formId: form.formId }).go();
      for (const sub of subResult.data) {
        allSubmissions.push({ ...sub, formName: form.name });
      }
    }

    // Sort by createdAt desc and take 20
    allSubmissions.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
    const recent = allSubmissions.slice(0, 20);

    const activities = recent.map((sub) => ({
      id: sub.submissionId,
      type: 'submission',
      user: 'Technician',
      action: 'submitted',
      target: sub.formName || 'Unknown Form',
      timestamp: sub.createdAt,
    }));

    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Activity Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity' });
  }
});

export default router;

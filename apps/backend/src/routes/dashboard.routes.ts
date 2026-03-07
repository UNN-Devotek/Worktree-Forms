import { Router, Request, Response } from 'express';
import {
  UserEntity,
  FormEntity,
  SubmissionEntity,
  ProjectEntity,
  FileUploadEntity,
} from '../lib/dynamo/index.js';
import { getSecurityMiddleware } from '../middleware/security.js';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate.js';
import { requireProjectAccess } from '../middleware/rbac.js';

const router = Router();

// ==========================================
// DASHBOARD & ADMIN ENDPOINTS
// ==========================================

// Admin Stats — requires ADMIN system role
router.get('/admin/stats', authenticate, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (user.systemRole !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
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
router.get('/projects/:projectId/metrics', requireProjectAccess('VIEWER'), async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

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

    // Get submissions for each form in parallel
    const submissionCounts = await Promise.all(
      forms.map((form) => SubmissionEntity.query.byForm({ formId: form.formId }).go()),
    );
    const statsByForm = forms.map((form, i) => ({ formName: form.name, count: submissionCounts[i].data.length }));
    const totalSubmissions = statsByForm.reduce((sum, s) => sum + s.count, 0);

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
router.get('/projects/:projectId/activity', requireProjectAccess('VIEWER'), async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const formsResult = await FormEntity.query.byProject({ projectId }).go();
    const forms = formsResult.data;

    if (forms.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Gather recent submissions across forms in parallel
    const submissionResults = await Promise.all(
      forms.map((form) => SubmissionEntity.query.byForm({ formId: form.formId }).go()),
    );
    const allSubmissions: Array<Record<string, unknown>> = [];
    forms.forEach((form, i) => {
      for (const sub of submissionResults[i].data) {
        allSubmissions.push({ ...sub, formName: form.name });
      }
    });

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

// Storage Usage Endpoint
router.get('/projects/:projectId/storage-usage', requireProjectAccess('VIEWER'), async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const [projectResult, filesResult] = await Promise.all([
      ProjectEntity.get({ projectId }).go(),
      FileUploadEntity.query.primary({ projectId }).go(),
    ]);

    const project = projectResult.data;
    const files = filesResult.data;

    const usedBytes = files.reduce((sum, f) => sum + (f.sizeBytes ?? 0), 0);
    const quotaBytes = project?.storageQuotaBytes ?? null;

    res.json({
      success: true,
      data: {
        usedBytes,
        quotaBytes,
        files: files.length,
      },
    });
  } catch (error) {
    console.error('Storage Usage Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch storage usage' });
  }
});

export default router;

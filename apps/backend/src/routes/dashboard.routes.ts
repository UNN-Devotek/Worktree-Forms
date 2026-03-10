import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  UserEntity,
  FormEntity,
  SubmissionEntity,
  ProjectEntity,
  ProjectMemberEntity,
  TaskEntity,
  RouteEntity,
  SheetEntity,
  FileUploadEntity,
  FavoriteEntity,
  RecentItemEntity,
  HelpArticleEntity,
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

    const [formsResult, membersResult, tasksResult, routesResult, sheetsResult, filesResult] = await Promise.all([
      FormEntity.query.byProject({ projectId }).go(),
      ProjectMemberEntity.query.primary({ projectId }).go(),
      TaskEntity.query.byProject({ projectId }).go(),
      RouteEntity.query.byProject({ projectId }).go(),
      SheetEntity.query.byProject({ projectId }).go(),
      FileUploadEntity.query.primary({ projectId }).go(),
    ]);

    const forms = formsResult.data;
    const tasks = tasksResult.data;

    // Get submissions for each form in parallel
    const submissionResults = await Promise.all(
      forms.map((form) => SubmissionEntity.query.byForm({ formId: form.formId }).go()),
    );

    const statsByForm = forms.map((form, i) => ({ formName: form.name, count: submissionResults[i].data.length }));
    const totalSubmissions = statsByForm.reduce((sum, s) => sum + s.count, 0);

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thisWeekSubmissions = submissionResults.flatMap((r) => r.data).filter((s) => (s.createdAt ?? '') >= oneWeekAgo).length;

    res.json({
      success: true,
      data: {
        totalSubmissions,
        thisWeekSubmissions,
        statsByForm,
        formCount: forms.length,
        activeForms: forms.filter((f) => f.status !== 'ARCHIVED').length,
        memberCount: membersResult.data.length,
        taskCount: tasks.length,
        openTaskCount: tasks.filter((t) => t.status !== 'COMPLETED').length,
        routeCount: routesResult.data.length,
        sheetCount: sheetsResult.data.length,
        fileCount: filesResult.data.length,
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
    allSubmissions.sort((a, b) => new Date(b.createdAt as string ?? 0).getTime() - new Date(a.createdAt as string ?? 0).getTime());
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

// ==========================================
// USER-LEVEL DASHBOARD ENDPOINTS
// ==========================================

// Zod schemas for request validation
const recentItemSchema = z.object({
  itemId: z.string().min(1),
  itemType: z.string().min(1),
  itemName: z.string().min(1),
  projectId: z.string().min(1),
  projectSlug: z.string().min(1),
});

const favoriteSchema = z.object({
  itemId: z.string().min(1),
  itemType: z.string().min(1),
  itemName: z.string().min(1),
  projectId: z.string().min(1),
  projectSlug: z.string().min(1),
});

// GET /dashboard/metrics — aggregated metrics across all user projects
router.get('/dashboard/metrics', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;

    // Get all projects the user is a member of
    const membershipsResult = await ProjectMemberEntity.query.byUser({ userId }).go();
    const projectIds = membershipsResult.data.map((m) => m.projectId).slice(0, 20);

    if (projectIds.length === 0) {
      return res.json({
        success: true,
        data: {
          totalProjects: 0,
          totalForms: 0,
          activeForms: 0,
          totalSubmissions: 0,
          thisWeekSubmissions: 0,
          totalTasks: 0,
          openTasks: 0,
          totalSheets: 0,
          totalRoutes: 0,
          totalFiles: 0,
        },
      });
    }

    // Query all entity types for each project in parallel
    const projectQueries = projectIds.map((projectId) =>
      Promise.all([
        FormEntity.query.byProject({ projectId }).go(),
        TaskEntity.query.byProject({ projectId }).go(),
        SheetEntity.query.byProject({ projectId }).go(),
        RouteEntity.query.byProject({ projectId }).go(),
        FileUploadEntity.query.primary({ projectId }).go(),
      ])
    );

    const projectResults = await Promise.all(projectQueries);

    // Collect all forms for submission queries
    const allForms: Array<{ formId: string }> = [];
    let totalTasks = 0;
    let openTasks = 0;
    let totalSheets = 0;
    let totalRoutes = 0;
    let totalFiles = 0;
    let activeForms = 0;

    for (const [formsResult, tasksResult, sheetsResult, routesResult, filesResult] of projectResults) {
      for (const form of formsResult.data) {
        allForms.push(form);
        if (form.status !== 'ARCHIVED') {
          activeForms++;
        }
      }
      totalTasks += tasksResult.data.length;
      openTasks += tasksResult.data.filter((t) => t.status !== 'COMPLETED').length;
      totalSheets += sheetsResult.data.length;
      totalRoutes += routesResult.data.length;
      totalFiles += filesResult.data.length;
    }

    // Query submissions for all forms in parallel
    const submissionResults = await Promise.all(
      allForms.map((form) => SubmissionEntity.query.byForm({ formId: form.formId }).go()),
    );

    const totalSubmissions = submissionResults.reduce((sum, r) => sum + r.data.length, 0);

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thisWeekSubmissions = submissionResults
      .flatMap((r) => r.data)
      .filter((s) => (s.createdAt ?? '') >= oneWeekAgo).length;

    res.json({
      success: true,
      data: {
        totalProjects: projectIds.length,
        totalForms: allForms.length,
        activeForms,
        totalSubmissions,
        thisWeekSubmissions,
        totalTasks,
        openTasks,
        totalSheets,
        totalRoutes,
        totalFiles,
      },
    });
  } catch (error) {
    console.error('Dashboard Metrics Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard metrics' });
  }
});

// GET /dashboard/recent — recent items for the authenticated user
router.get('/dashboard/recent', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;

    const result = await RecentItemEntity.query.primary({ userId }).go({
      order: 'desc',
      limit: 10,
    });

    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Recent Items Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recent items' });
  }
});

// POST /dashboard/recent — track a recently accessed item
router.post('/dashboard/recent', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;

    const parsed = recentItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid request body', details: parsed.error.issues });
    }

    const { itemId, itemType, itemName, projectId, projectSlug } = parsed.data;

    // Deduplication: find and delete existing entry for same item
    const existingResult = await RecentItemEntity.query.primary({ userId }).go();
    const duplicate = existingResult.data.find((item) => item.itemId === itemId);
    if (duplicate) {
      await RecentItemEntity.delete({
        userId,
        accessedAt: duplicate.accessedAt,
        itemId: duplicate.itemId,
      }).go();
    }

    // Create new recent item entry
    const now = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

    await RecentItemEntity.create({
      userId,
      itemId,
      itemType,
      itemName,
      projectId,
      projectSlug,
      accessedAt: now,
      ttl,
    }).go();

    res.json({ success: true });
  } catch (error) {
    console.error('Track Recent Error:', error);
    res.status(500).json({ success: false, message: 'Failed to track recent item' });
  }
});

// GET /dashboard/favorites — list user favorites
router.get('/dashboard/favorites', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;

    const result = await FavoriteEntity.query.primary({ userId }).go();

    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Favorites Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch favorites' });
  }
});

// POST /dashboard/favorites — add a favorite
router.post('/dashboard/favorites', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;

    const parsed = favoriteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid request body', details: parsed.error.issues });
    }

    const { itemId, itemType, itemName, projectId, projectSlug } = parsed.data;

    await FavoriteEntity.create({
      userId,
      itemId,
      itemType,
      itemName,
      projectId,
      projectSlug,
    }).go();

    res.json({ success: true });
  } catch (error) {
    console.error('Add Favorite Error:', error);
    res.status(500).json({ success: false, message: 'Failed to add favorite' });
  }
});

// DELETE /dashboard/favorites/:itemType/:itemId — remove a favorite
router.delete('/dashboard/favorites/:itemType/:itemId', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { itemType, itemId } = req.params;

    await FavoriteEntity.delete({
      userId,
      itemType,
      itemId,
    }).go();

    res.json({ success: true });
  } catch (error) {
    console.error('Remove Favorite Error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove favorite' });
  }
});

// GET /dashboard/news — news articles or fallback dummy content
router.get('/dashboard/news', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await HelpArticleEntity.query.byCategory({ category: 'news' }).go();
    const published = result.data.filter((a) => a.status === 'PUBLISHED');

    if (published.length > 0) {
      return res.json({ success: true, data: published });
    }

    // Fallback: hardcoded dummy articles
    const fallbackArticles = [
      {
        articleId: 'news-1',
        title: 'Welcome to Worktree',
        content: 'Worktree is your all-in-one project management platform. Create projects, build forms, manage tasks, and collaborate with your team.',
        publishedAt: new Date().toISOString(),
      },
      {
        articleId: 'news-2',
        title: 'Smart Sheets Now Available',
        content: 'Real-time collaborative spreadsheets are here. Create sheets, add columns, and work together with your team in real-time.',
        publishedAt: new Date().toISOString(),
      },
      {
        articleId: 'news-3',
        title: 'Form Builder Updates',
        content: 'The form builder has been updated with new question types, conditional logic, and improved mobile responsiveness.',
        publishedAt: new Date().toISOString(),
      },
    ];

    res.json({ success: true, data: fallbackArticles });
  } catch (error) {
    console.error('News Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch news' });
  }
});

export default router;

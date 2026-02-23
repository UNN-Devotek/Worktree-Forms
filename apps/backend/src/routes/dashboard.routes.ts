import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { getSecurityMiddleware } from '../middleware/security.js';
import { parsePaginationParam } from '../utils/query.js';

const router = Router();

// ==========================================
// DASHBOARD & ADMIN ENDPOINTS
// ==========================================

// Admin Stats
router.get('/admin/stats', async (req: Request, res: Response) => {
    try {
        const [totalUsers, activeForms, totalSubmissions] = await prisma.$transaction([
            prisma.user.count(),
            prisma.form.count({ where: { is_active: true } }),
            prisma.submission.count(),
        ]);
        
        res.json({
            success: true,
            data: {
                totalUsers,
                activeForms,
                totalSubmissions,
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
        const { id } = req.params;

        // 0. Get Project Usage Stats
        const project = await prisma.project.findUnique({
             where: { id },
             select: { plan: true, storageUsage: true, submissionCount: true }
        });

        // 1. Get Forms for Project
        const forms = await prisma.form.findMany({
            where: { projectId: id }, // Schema uses projectId camelCase
            select: { id: true }
        });
        const formIds = forms.map(f => f.id);

        if (formIds.length === 0) {
            return res.json({
                success: true,
                data: {
                    totalSubmissions: 0,
                    statsByForm: [],
                    plan: project?.plan || 'FREE',
                    storageUsage: project?.storageUsage?.toString() || '0',
                    submissionCount: project?.submissionCount || 0
                }
            });
        }


        // 2. Count Total Submissions
        // @ts-ignore
        const totalSubmissions = await prisma.submission.count({
            where: { 
                form_id: { in: formIds } 
            }
        });

        // 3. Count by FormVersion
        // @ts-ignore
        const byForm = await prisma.submission.groupBy({
            by: ['form_version_id'],
            where: { 
                form_id: { in: formIds }
            },
            _count: {
                _all: true
            }
        });

        // 4. Get Form Names/Versions
        const versionIds = (byForm as any[])
            .map(g => g.form_version_id)
            .filter((vid): vid is number => vid !== null);

        const formVersions = await prisma.formVersion.findMany({
            where: { id: { in: versionIds } },
            include: { form: true }
        });

        const statsByForm = (byForm as any[]).map(group => {
            if (!group.form_version_id) return null;
            const fv = formVersions.find(v => v.id === group.form_version_id);
            return {
                formName: fv?.form.title || 'Unknown Form',
                version: fv?.version || 0,
                count: group._count._all
            };
        }).filter(Boolean);

        res.json({
            success: true,
            data: {
                totalSubmissions,
                statsByForm,
                plan: project?.plan || 'FREE',
                storageUsage: project?.storageUsage?.toString() || '0',
                submissionCount: project?.submissionCount || 0
            }
        });

    } catch (error) {
        console.error('Metrics Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch metrics' });
    }
});

// Get Project Activity Feed
router.get('/projects/:id/activity', getSecurityMiddleware(), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const take = parsePaginationParam(req.query.take, 20, 100);
        const skip = parsePaginationParam(req.query.skip, 0, 100000);

         // 1. Get Forms for Project
         const forms = await prisma.form.findMany({
            where: { projectId: id },
            select: { id: true }
        });
        const formIds = forms.map(f => f.id);

        if (formIds.length === 0) {
            return res.json({ success: true, data: [], meta: { take, skip } });
        }

        // 2. Fetch submissions
        const recentSubmissions = await prisma.submission.findMany({
            where: {
                form_id: { in: formIds }
            },
            orderBy: { createdAt: 'desc' },
            take,
            skip,
            include: {
                // User not directly linked in Submission schema.
                // Omitting user for now.
                form_version: {
                    include: { form: true }
                }
            }
        });

        // 3. Transform
        const activities = recentSubmissions.map(sub => ({
            id: sub.id,
            type: 'submission',
            user: 'Technician',
            action: 'submitted',
            target: sub.form_version?.form.title || 'Unknown Form',
            timestamp: sub.createdAt
        }));

        res.json({
            success: true,
            data: activities,
            meta: { take, skip }
        });

    } catch (error) {
        console.error('Activity Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch activity' });
    }
});

export default router;

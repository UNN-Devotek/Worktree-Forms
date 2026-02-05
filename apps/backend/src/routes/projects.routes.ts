import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import multer from 'multer';
import { UploadService } from '../services/upload.service.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });


// ==========================================
// PROJECT ENDPOINTS
// ==========================================

// Get all projects
router.get('/', async (req: Request, res: Response) => {
    try {
        const projects = await prisma.project.findMany({
            orderBy: { updatedAt: 'desc' },
            include: {
                _count: {
                    select: { forms: true, members: true }
                }
            }
        });
        res.json({ success: true, data: projects });
    } catch (error) {
        console.error('Fetch Projects Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch projects' });
    }
});

// My Daily Route (Field Ops)
router.get('/:id/routes/my-daily', async (req: Request, res: Response) => {
     const { id } = req.params; // project ID or slug
     const { userId } = req.query; // temporary, should use auth middleware
     
     try {
         // Mock response for now, or minimal DB query
         // In real app: Find Project -> Find Schedule -> Find Stops for Today -> Filter by User
         
         const todayStr = new Date().toISOString();
         
         const route = {
             id: 101,
             date: todayStr,
             status: 'active',
             stops: [
                 { 
                     id: 1, 
                     title: 'Foundation Check', 
                     address: '123 Main St, Reno, NV', 
                     status: 'pending', 
                     priority: 'high', 
                     order: 1,
                     latitude: 39.5296,
                     longitude: -119.8138,
                     scheduledAt: new Date().toISOString(),
                     form: { id: 1, title: 'Safety Inspection' }
                 },
                 { 
                     id: 2, 
                     title: 'Wiring Validation', 
                     address: '456 Elm St, Sparks, NV', 
                     status: 'pending', 
                     priority: 'normal', 
                     order: 2,
                     latitude: 39.5345,
                     longitude: -119.7500
                 }
             ]
         };

         res.json({ success: true, data: { route } });
     } catch (error) {
         console.error('Daily Route Error:', error);
         res.status(500).json({ success: false, error: 'Failed to fetch daily route' });
     }
});

// Get single project
router.get('/:idOrSlug', async (req: Request, res: Response) => {
    const { idOrSlug } = req.params;
    try {
        // Try ID first, then Slug
        let project = await prisma.project.findFirst({
            where: {
                OR: [
                    { id: idOrSlug },
                    { slug: idOrSlug }
                ]
            },
            include: {
                _count: {
                    select: { forms: true, members: true }
                }
            }
        });
        
        if (!project) {
             return res.status(404).json({ success: false, error: 'Project not found' });
        }
        res.json({ success: true, data: project });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch project' });
    }
});

// Create project
router.post('/', async (req: Request, res: Response) => {
    const { name, description } = req.body;
    // Mock user ID for now or get from auth
    const userId = (req.headers['x-user-id'] as string) || 'user-1';

    try {
        // Simple slug generation
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
        
        const project = await prisma.project.create({
            data: {
                name,
                description,
                slug,
                createdById: userId 
            }
        });
        res.status(201).json({ success: true, data: project });
    } catch (error: any) {
        console.error('Create Project Error:', error);
        res.status(500).json({ success: false, error: 'Failed to create project', details: error.message });
    }
});

// Generic Project Upload (for RFI photos, etc)
router.post('/:projectId/upload', upload.single('file'), async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const userId = (req.headers['x-user-id'] as string) || 'dev-admin'; 
    
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    try {
        const fileRecord = await UploadService.uploadFile(req.file, `projects/${projectId}/uploads`, userId);
        const url = UploadService.getFileUrl(fileRecord.objectKey);
        
        res.json({
            success: true,
            data: {
                ...fileRecord,
                url
            }
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ success: false, error: 'Upload failed' });
    }
});


// ==========================================
// FOLDER ENDPOINTS
// ==========================================

// NOTE: Ideally these should be under /api/projects/:id/folders if they were strictly hierarchical,
// but architectural decision was loose coupling or global folders?
// The original index.ts had /api/folders at root. We'll keep them here or in a separate file?
// Let's create `folders.routes.ts` separately for cleanliness if they are top-level.
// BUT, often folders belong to projects.
// Re-reading code: `app.get('/api/folders'...)`.
// I'll put folders in a separate file `folders.routes.ts` to be safe/clean.

export default router;

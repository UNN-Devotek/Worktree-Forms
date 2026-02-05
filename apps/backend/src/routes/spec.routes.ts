import { Router, Request, Response } from 'express';
import { SpecService } from '../services/spec.service.js';

const router = Router();

// ==========================================
// SPECIFICATION ENDPOINTS
// ==========================================

// Search/List Specs
router.get('/projects/:projectId/specs', async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const { q, type } = req.query;
    try {
        const specs = await SpecService.searchSpecs(projectId, q as string, (type as string) || 'SPEC');
        res.json({ success: true, data: specs });
    } catch (error) {
        console.error('Fetch Specs Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch specs' });
    }
});

// Create Spec
router.post('/projects/:projectId/specs', async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const { section, title, keywords, type, fileUrl, objectKey } = req.body;
    const userId = (req.headers['x-user-id'] as string) || 'dev-admin';

    try {
        const spec = await SpecService.createSpec({
            projectId,
            section,
            title,
            keywords,
            type,
            fileUrl,
            objectKey,
            uploadedById: userId
        });
        res.json({ success: true, data: spec });
    } catch (error) {
        console.error('Create Spec Error:', error);
        res.status(500).json({ success: false, error: 'Failed to create spec' });
    }
});

// Delete Spec
router.delete('/specs/:specId', async (req: Request, res: Response) => {
    const { specId } = req.params;
    try {
        // Find first to get object key? (Optional cleanup)
        // For MVP, just delete record.
        await SpecService.deleteSpec(specId);
        res.json({ success: true });
    } catch (error) {
         console.error('Delete Spec Error:', error);
         res.status(500).json({ success: false, error: 'Failed to delete spec' });
    }
});

export default router;

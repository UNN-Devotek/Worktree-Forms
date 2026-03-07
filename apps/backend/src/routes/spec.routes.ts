import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authenticate.js';
import { requireProjectAccess } from '../middleware/rbac.js';
import { SpecService } from '../services/spec.service.js';

const router = Router();

// ==========================================
// SPECIFICATION ENDPOINTS
// ==========================================

// Search/List Specs
router.get('/projects/:projectId/specs', requireProjectAccess('VIEWER'), async (req: Request, res: Response) => {
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
router.post('/projects/:projectId/specs', requireProjectAccess('EDITOR'), async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const { section, title, keywords, type, fileUrl, objectKey } = req.body;
    const userId = (req as AuthenticatedRequest).user.id;

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

// Semantic Search Specs
router.get('/projects/:projectId/specs/semantic-search', requireProjectAccess('VIEWER'), async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const { query } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
        res.status(400).json({ success: false, error: 'query parameter is required' });
        return;
    }

    try {
        const specs = await SpecService.semanticSearchSpecs(projectId, query.trim());
        res.json({ success: true, data: specs });
    } catch (error) {
        console.error('Semantic Search Specs Error:', error);
        res.status(500).json({ success: false, error: 'Failed to perform semantic search' });
    }
});

// Delete Spec
router.delete('/projects/:projectId/specs/:specId', requireProjectAccess('ADMIN'), async (req: Request, res: Response) => {
    const { projectId, specId } = req.params;
    try {
        await SpecService.deleteSpec(projectId, specId);
        res.json({ success: true });
    } catch (error) {
         console.error('Delete Spec Error:', error);
         res.status(500).json({ success: false, error: 'Failed to delete spec' });
    }
});

export default router;

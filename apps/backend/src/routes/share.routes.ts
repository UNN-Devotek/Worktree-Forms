import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { ShareService } from '../services/share.service.js';
import { StorageService } from '../storage.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// ==========================================
// PUBLIC SHARING
// ==========================================

// Validate and Access Generic Token
router.get('/access/:token', async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const publicToken = await ShareService.validateToken(token);
        
        if (!publicToken) {
            return res.status(404).json({ success: false, error: 'Token invalid or expired' });
        }

        // Fetch the underlying resource
        let resourceData: any = null;
        if (publicToken.resourceType === 'FORM') {
            const form = await prisma.form.findUnique({ where: { id: parseInt(publicToken.resourceId) }});
            // Don't expose everything, just what's needed for the public view
            resourceData = form ? { id: form.id, title: form.title, schema: form.form_schema, type: 'FORM' } : null;
        } else if (publicToken.resourceType === 'SPEC' || publicToken.resourceType === 'BLUEPRINT') {
            const spec = await prisma.specification.findUnique({ where: { id: publicToken.resourceId }});
            if (spec) {
                 const signedUrl = await StorageService.getDownloadUrl(spec.objectKey);
                 resourceData = { ...spec, signedUrl, type: 'SPEC' }; // Reuse SPEC type for frontend viewer
            }
        } else if (publicToken.resourceType === 'SHEET') {
            const sheet = await prisma.sheet.findUnique({ where: { id: publicToken.resourceId } });
            if (sheet) {
                resourceData = { id: sheet.id, title: sheet.title, type: 'SHEET' };
            }
        }

        if (!resourceData) {
             return res.status(404).json({ success: false, error: 'Resource not found' });
        }

        res.json({ success: true, data: resourceData });
    } catch (error) {
         console.error('Public Access Error:', error);
         res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});


// Generate Token (Auth Required)
router.post('/generate', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        
        const { resourceType, resourceId, expiresInDays } = req.body;
        
        if (!resourceType || !resourceId) {
             return res.status(400).json({ error: "Missing resourceType or resourceId" });
        }

        const token = await ShareService.createPublicLink(userId, resourceType, resourceId, expiresInDays);
        
        // Construct full URL
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3005';
        const link = `${frontendUrl}/public/${resourceType.toLowerCase()}/${token.token}`;

        res.json({ success: true, data: { ...token, link } });
    } catch (error) {
        console.error('Share Error:', error);
         res.status(500).json({ success: false, error: 'Failed to generate link' });
    }
});

export default router;

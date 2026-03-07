import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authenticate.js';
import { FormEntity, SheetEntity } from '../lib/dynamo/index.js';
import { ShareService } from '../services/share.service.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireProjectAccess } from '../middleware/rbac.js';
import { publicRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// ==========================================
// PUBLIC SHARING
// ==========================================

// Validate and Access Generic Token
router.get('/access/:token', publicRateLimiter, async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const publicToken = await ShareService.validateToken(token);

    if (!publicToken) {
      return res.status(404).json({ success: false, error: 'Token invalid or expired' });
    }

    let resourceData: Record<string, unknown> | null = null;

    if (publicToken.entityType === 'FORM') {
      // Direct primary-key lookup — avoids fetching all project forms
      const formResult = await FormEntity.get({ projectId: publicToken.projectId, formId: publicToken.entityId }).go();
      const form = formResult.data;
      if (form) {
        resourceData = { id: form.formId, title: form.name, schema: form.schema, type: 'FORM' };
      }
    } else if (publicToken.entityType === 'SHEET') {
      const sheetResult = await SheetEntity.get({ projectId: publicToken.projectId, sheetId: publicToken.entityId }).go();
      const sheet = sheetResult.data;
      if (sheet) {
        resourceData = { id: sheet.sheetId, title: sheet.name, type: 'SHEET' };
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
router.post('/generate', authenticate, requireProjectAccess('EDITOR'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { resourceType, resourceId, expiresInDays, projectId } = req.body;

    if (!resourceType || !resourceId || !projectId) {
      return res.status(400).json({ error: 'Missing resourceType, resourceId, or projectId' });
    }

    const token = await ShareService.createPublicLink(userId, projectId, resourceType, resourceId, expiresInDays);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3005';
    const link = `${frontendUrl}/public/${resourceType.toLowerCase()}/${token.token}`;

    res.json({ success: true, data: { ...token, link } });
  } catch (error) {
    console.error('Share Error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate link' });
  }
});

export default router;

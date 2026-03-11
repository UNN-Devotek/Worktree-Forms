import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authenticate.js';
import { requireProjectAccess } from '../middleware/rbac.js';
import { ApiKeyService } from '../services/api-key.service.js';
import { ApiKeyEntity } from '../lib/dynamo/index.js';
import { deletionLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// ============================================
// API Key Management Routes
// ============================================

// Generate New API Key (Auth Required)
router.post('/', requireProjectAccess('ADMIN'), async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { name, scopes, projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'projectId is required' });
    }

    const { rawKey, apiKey } = await ApiKeyService.generateKey(
      projectId,
      userId,
      name,
      scopes ? (Array.isArray(scopes) ? scopes : [scopes]) : ['READ'],
    );

    res.json({
      success: true,
      key: rawKey, // WARN: Only shown once
      record: {
        keyHash: apiKey.keyHash,
        name: apiKey.name,
        scopes: apiKey.scopes,
        createdAt: apiKey.createdAt,
      },
    });
  } catch (error) {
    console.error('API Key Generation Error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate API key' });
  }
});

// List API Keys (Auth Required)
router.get('/', requireProjectAccess('ADMIN'), async (req: Request, res: Response) => {
  try {
    const projectId = req.query.projectId as string;
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'projectId query parameter required' });
    }

    const keys = await ApiKeyService.listKeys(projectId);

    const masked = keys.map((k) => ({
      keyHash: k.keyHash,
      name: k.name,
      scopes: k.scopes,
      lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt,
      keyPreview: 'sk_........',
    }));

    res.json({ success: true, data: masked });
  } catch (error) {
    console.error('API Key List Error:', error);
    res.status(500).json({ success: false, error: 'Failed to list keys' });
  }
});

// Revoke API Key (Auth Required) — projectId required for RBAC
router.delete('/:keyHash', deletionLimiter, requireProjectAccess('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { keyHash } = req.params;
    const projectId = req.query.projectId as string || req.body.projectId;
    // Verify the key belongs to this project via direct primary-key lookup (O(1) vs O(n) list scan)
    const keyResult = await ApiKeyEntity.get({ keyHash }).go();
    if (!keyResult.data || keyResult.data.projectId !== projectId) {
      return res.status(404).json({ success: false, error: 'Key not found in this project' });
    }
    await ApiKeyService.revokeKey(keyHash);
    res.json({ success: true, message: 'Key revoked' });
  } catch (error) {
    console.error('API Key Revoke Error:', error);
    res.status(500).json({ success: false, error: 'Failed to revoke key' });
  }
});

export default router;

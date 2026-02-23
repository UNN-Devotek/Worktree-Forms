import { Router, Request, Response } from 'express';
import { ApiKeyService } from '../services/api-key.service.js';
import { deletionLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// ============================================
// API Key Management Routes
// ============================================

// Generate New API Key (Auth Required)
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { note, scope } = req.body;

    const { rawKey, apiKey } = await ApiKeyService.generateKey(userId, note, scope);

    res.json({
      success: true,
      key: rawKey, // WARN: Only shown once
      record: {
        id: apiKey.id,
        note: apiKey.note,
        scope: apiKey.scope,
        createdAt: apiKey.createdAt
      }
    });
  } catch (error) {
    console.error('API Key Generation Error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate API key' });
  }
});

// List API Keys (Auth Required)
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const keys = await ApiKeyService.listKeys(userId);

    // Mask the keyHash for security
    const masked = keys.map(k => ({
      id: k.id,
      note: k.note,
      scope: k.scope,
      lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt,
      keyPreview: 'sk_••••••••'
    }));

    res.json({ success: true, data: masked });
  } catch (error) {
    console.error('API Key List Error:', error);
    res.status(500).json({ success: false, error: 'Failed to list keys' });
  }
});

// Revoke API Key (Auth Required)
router.delete('/:id', deletionLimiter, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    await ApiKeyService.revokeKey(id, userId);
    res.json({ success: true, message: 'Key revoked' });
  } catch (error) {
    console.error('API Key Revoke Error:', error);
    res.status(500).json({ success: false, error: 'Failed to revoke key' });
  }
});

export default router;

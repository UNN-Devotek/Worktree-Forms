import { Router, Request, Response } from 'express';
import { RfiService } from '../services/rfi.service.js';

const router = Router();

// ==========================================
// RFI ENDPOINTS
// ==========================================

// Get Project RFIs
router.get('/projects/:projectId/rfis', async (req: Request, res: Response) => {
    const { projectId } = req.params;
    try {
        const rfis = await RfiService.getProjectRfis(projectId);
        res.json({ success: true, data: rfis });
    } catch (error) {
        console.error('Fetch RFIs Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch RFIs' });
    }
});

// Create RFI
router.post('/projects/:projectId/rfis', async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { title, question, images } = req.body;
  const userId = (req as any).user.id;

  try {
      const rfi = await RfiService.createRfi({
          projectId,
          title,
          question,
          createdById: userId,
          images
      });
      res.json({ success: true, data: rfi });
  } catch (error) {
      console.error('Create RFI Error:', error);
      res.status(500).json({ success: false, error: 'Failed to create RFI' });
  }
});

// Update RFI
router.patch('/rfis/:rfiId', async (req: Request, res: Response) => {
    const { rfiId } = req.params;
    const updates = req.body;
    try {
        const rfi = await RfiService.updateRfi(rfiId, updates);
        res.json({ success: true, data: rfi });
    } catch (error) {
        console.error('Update RFI Error:', error);
        res.status(500).json({ success: false, error: 'Failed to update RFI' });
    }
});

export default router;

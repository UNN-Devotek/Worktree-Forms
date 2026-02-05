import { Router, Request, Response } from 'express';
import multer from 'multer';
import { UploadService } from '../services/upload.service.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ==========================================
// GENERIC UPLOAD ENDPOINT
// ==========================================

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file provided" });
        }
        
        // Mock Auth check (optional for generic upload, usually required)
        // const userId = req.headers['x-user-id'] || 'anonymous';

        const result = await UploadService.uploadFile(req.file, 'uploads');
        // Return full URL for frontend
        const url = UploadService.getFileUrl(result.objectKey);
        
        res.json({ 
            success: true, 
            data: {
                ...result,
                url
            } 
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

export default router;

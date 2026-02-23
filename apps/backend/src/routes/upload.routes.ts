import { Router, Request, Response } from 'express';
import multer from 'multer';
import { UploadService } from '../services/upload.service.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit

// ==========================================
// GENERIC UPLOAD ENDPOINT
// ==========================================

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: "No file provided" });
        }

        const BLOCKED_EXTENSIONS = ['.exe', '.sh', '.bat', '.cmd', '.ps1', '.dll', '.so', '.bin'];
        const BLOCKED_MIMETYPES = ['application/x-executable', 'application/x-msdownload', 'application/x-sh'];
        const ext = '.' + (req.file.originalname.split('.').pop() || '').toLowerCase();
        if (BLOCKED_EXTENSIONS.includes(ext) || BLOCKED_MIMETYPES.includes(req.file.mimetype)) {
            return res.status(400).json({ success: false, error: 'File type not allowed' });
        }

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
        res.status(500).json({ success: false, error: 'Failed to upload file' });
    }
});

export default router;
